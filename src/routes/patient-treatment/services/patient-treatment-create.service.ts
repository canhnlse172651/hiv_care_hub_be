import { BadRequestException, ConflictException, HttpException, Injectable } from '@nestjs/common'
import type { PatientTreatment } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { PatientTreatmentRepository } from 'src/repositories/patient-treatment.repository'
import { ENTITY_NAMES } from 'src/shared/constants/api.constants'
import { SharedErrorHandlingService } from 'src/shared/services/error-handling.service'
import { PaginationService } from 'src/shared/services/pagination.service'
import { CreatePatientTreatmentSchema, CustomMedicationType } from '../patient-treatment.model'

export const VALID_SCHEDULES = ['MORNING', 'AFTERNOON', 'NIGHT'] as const
export type ValidSchedule = (typeof VALID_SCHEDULES)[number]

interface CreatePatientTreatmentInput {
  patientId: string | number
  doctorId: string | number
  protocolId?: string | number | null
  startDate?: string | number | Date
  endDate?: string | number | Date | null
  notes?: string
  customMedications?: string | CustomMedicationType | CustomMedicationType[]
  status?: boolean
}

@Injectable()
export class PatientTreatmentCreateService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly paginationService: PaginationService,
    private readonly errorHandlingService: SharedErrorHandlingService,
  ) {}

  /**
   * Tạo mới điều trị cho bệnh nhân, kiểm tra business rule và chuẩn hóa dữ liệu
   */
  async createPatientTreatment(
    data: CreatePatientTreatmentInput,
    userId: number,
    autoEndExisting = false,
    validate = true,
  ): Promise<PatientTreatment> {
    try {
      // 1. Parse & validate input
      const { patientId, doctorId, protocolId, startDate, endDate, notes, rawCustomMeds } = this.parseAndValidateInput(
        data,
        validate,
      )

      // 2. Business rule: Only one active treatment per patient
      if (autoEndExisting) {
        await this.autoEndActiveTreatments(patientId)
      } else {
        await this.ensureNoExistingActiveTreatment(patientId)
      }

      // 3. Normalize custom medications
      const customMedications = PatientTreatmentCreateService.normalizeCustomMedicationsSchedule(rawCustomMeds)

      // 4. Business rule: if custom meds provided, protocolId is required
      if (customMedications.length > 0 && !protocolId) {
        throw new BadRequestException(
          'Custom medications require a valid protocolId. Personalized treatments must be based on an existing protocol.',
        )
      }

      // 5. Calculate total cost
      const total = await this.calculateTotal(protocolId, customMedications)

      // 6. Create record
      const created = await this.patientTreatmentRepository.createPatientTreatment({
        patientId,
        doctorId,
        protocolId,
        startDate,
        endDate,
        notes,
        customMedications,
        total,
        createdById: userId,
        status: data.status ?? false,
      })

      // 7. Normalize in response
      if (created.customMedications) {
        created.customMedications = PatientTreatmentCreateService.normalizeCustomMedicationsSchedule(
          created.customMedications as any,
        )
      }

      return created
    } catch (error) {
      if (error instanceof HttpException) throw error
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Tự động kết thúc các điều trị active hiện tại của bệnh nhân
   */
  private async autoEndActiveTreatments(patientId: number) {
    const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })
    if (activeTreatments?.length) {
      const now = new Date()
      for (const treatment of activeTreatments) {
        await this.patientTreatmentRepository.updatePatientTreatment(treatment.id, { endDate: now })
      }
    }
  }

  private parseAndValidateInput(
    data: CreatePatientTreatmentInput,
    validate: boolean,
  ): {
    patientId: number
    doctorId: number
    protocolId?: number
    startDate: Date
    endDate?: Date
    notes?: string
    rawCustomMeds: unknown
  } {
    const patientId = this.safeParseNumber(data.patientId, 'patientId')
    const doctorId = this.safeParseNumber(data.doctorId, 'doctorId')
    const protocolId = data.protocolId != null ? this.safeParseNumber(data.protocolId, 'protocolId') : undefined

    const startDate = data.startDate ? new Date(data.startDate) : new Date()
    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startDate')
    }

    const endDate = data.endDate != null ? new Date(data.endDate) : undefined
    if (endDate && isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid endDate')
    }

    const notes = typeof data.notes === 'string' ? data.notes.trim() : undefined
    const rawCustomMeds = data.customMedications

    // Zod validation with dummy total
    if (validate) {
      CreatePatientTreatmentSchema.parse({
        patientId,
        doctorId,
        protocolId,
        startDate,
        endDate,
        notes,
        customMedications: undefined,
        total: 0,
        status: data.status ?? false,
      })
    }

    return { patientId, doctorId, protocolId, startDate, endDate, notes, rawCustomMeds }
  }

  private async ensureNoExistingActiveTreatment(patientId: number) {
    const active = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })
    if (active?.length) {
      const protocols = [...new Set(active.map((t) => t.protocolId))]
      throw new ConflictException(
        `Patient ${patientId} already has ${active.length} active treatment(s) with protocol(s): ${protocols.join(', ')}. Only 1 active protocol per patient is allowed.`,
      )
    }
  }

  private async calculateTotal(protocolId: number | undefined, customMeds: CustomMedicationType[]): Promise<number> {
    let total = 0

    if (protocolId) {
      const protocol = await this.patientTreatmentRepository.findProtocolWithMedicines(protocolId)
      for (const pm of protocol?.medicines ?? []) {
        // pm.medicine.price is Decimal
        total += this.calcMedicineCost(pm.medicine.price, pm.durationUnit, pm.durationValue)
      }
    }

    for (const cm of customMeds) {
      total += this.calcMedicineCost(cm.price ?? 0, cm.durationUnit, cm.durationValue)
    }

    return total
  }

  private calcMedicineCost(
    price: Prisma.Decimal | number | string,
    unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
    value: number,
  ): number {
    // Convert Prisma.Decimal to number
    let numericPrice: number
    if (price instanceof Prisma.Decimal) {
      numericPrice = price.toNumber()
    } else {
      numericPrice = Number(price)
    }
    const daysMap: Record<string, number> = {
      DAY: 1,
      WEEK: 7,
      MONTH: 30,
      YEAR: 365,
    }
    const days = daysMap[unit] ?? 1
    return numericPrice * days * value
  }

  private safeParseNumber(value: string | number, field: string): number {
    if (typeof value === 'number' && !isNaN(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (!isNaN(parsed)) return parsed
    }
    throw new BadRequestException(`Invalid or missing numeric field: ${field}`)
  }

  private static normalizeSchedule(raw: unknown): ValidSchedule | undefined {
    if (typeof raw === 'string' && VALID_SCHEDULES.includes(raw as ValidSchedule)) {
      return raw as ValidSchedule
    }
    return undefined
  }

  private static normalizeCustomMedicationsSchedule(raw: unknown): CustomMedicationType[] {
    if (!raw) return []
    const arr = Array.isArray(raw) ? raw : [raw]
    return arr
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const med = item as Record<string, any>
        const medicineName = typeof med.medicineName === 'string' ? med.medicineName.trim() : ''
        const dosage = typeof med.dosage === 'string' ? med.dosage.trim() : ''
        const frequency = typeof med.frequency === 'string' ? med.frequency.trim() : ''
        const durationValue =
          typeof med.durationValue === 'number' && med.durationValue > 0
            ? med.durationValue
            : Number(med.durationValue) || 1
        const durationUnit =
          typeof med.durationUnit === 'string' && ['DAY', 'WEEK', 'MONTH', 'YEAR'].includes(med.durationUnit)
            ? (med.durationUnit as CustomMedicationType['durationUnit'])
            : 'DAY'
        const schedule = this.normalizeSchedule(med.schedule)
        const price =
          med.price instanceof Prisma.Decimal && med.price.gte(0)
            ? med.price.toNumber()
            : typeof med.price === 'number' && med.price >= 0
              ? med.price
              : undefined

        const result: CustomMedicationType = {
          medicineName,
          dosage,
          frequency,
          durationValue,
          durationUnit,
        }
        if (schedule) result.schedule = schedule
        if (price !== undefined) result.price = price
        return result
      })
      .filter((m) => m.medicineName !== '' && m.dosage !== '' && m.frequency !== '' && m.durationValue > 0)
  }
}
