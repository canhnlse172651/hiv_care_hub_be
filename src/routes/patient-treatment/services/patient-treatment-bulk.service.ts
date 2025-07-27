import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { PatientTreatmentRepository } from 'src/repositories/patient-treatment.repository'
import { CreatePatientTreatmentSchema, type CustomMedicationType } from '../patient-treatment.model'

type TreatmentItem = {
  patientId: string | number
  doctorId: string | number
  protocolId: string | number
  startDate?: string | number | Date
  endDate?: string | number | Date
  notes?: string
  total?: string | number
  customMedications?: any
}
type BulkData = {
  items: TreatmentItem[]
  continueOnError?: boolean
  validateBeforeCreate?: boolean
}

@Injectable()
export class PatientTreatmentBulkService {
  constructor(private readonly patientTreatmentRepository: PatientTreatmentRepository) {}

  /**
   * Tạo nhiều điều trị cho bệnh nhân (bulk create), kiểm tra business rule và validate dữ liệu
   */
  async bulkCreatePatientTreatments(data: any, userId: number): Promise<any[]> {
    const results: any[] = []
    const errors: string[] = []
    const bulkData = data as BulkData
    if (!bulkData.items || !Array.isArray(bulkData.items) || bulkData.items.length === 0) {
      throw new BadRequestException('Invalid or missing items array in bulk create payload')
    }
    const batchSize = Math.min(10, Math.max(1, bulkData.items.length))
    const continueOnError = !!bulkData.continueOnError
    const validateBeforeCreate = bulkData.validateBeforeCreate !== false

    // Group items by patientId for bulk validation
    const patientGroups: Record<number, number[]> = {}
    bulkData.items.forEach((item: TreatmentItem, index: number) => {
      const patientId = Number(item.patientId)
      if (!patientGroups[patientId]) patientGroups[patientId] = []
      patientGroups[patientId].push(index + 1)
    })

    // Detect bulk violations: more than one treatment per patient in request
    const bulkViolations: string[] = Object.entries(patientGroups)
      .filter(([_, indices]) => indices.length > 1)
      .map(
        ([patientId, indices]) =>
          `Patient ${patientId} has ${indices.length} treatments in bulk request (items: ${indices.join(', ')}). Only 1 active treatment per patient is allowed by business rules.`,
      )

    if (bulkViolations.length > 0) {
      throw new BadRequestException(`Bulk create validation failed:\n${bulkViolations.join('\n')}`)
    }

    for (let i = 0; i < bulkData.items.length; i += batchSize) {
      const batch = bulkData.items.slice(i, i + batchSize)
      for (const [batchIndex, treatment] of batch.entries()) {
        const itemIndex = i + batchIndex + 1
        try {
          const processedTreatment = this.parseTreatmentItem(treatment, itemIndex, userId)

          if (validateBeforeCreate) {
            CreatePatientTreatmentSchema.parse(processedTreatment)
          }

          const existingActive = await this.patientTreatmentRepository.getActivePatientTreatments({
            patientId: processedTreatment.patientId,
          })

          if (Array.isArray(existingActive) && existingActive.length > 0) {
            const activeProtocols = new Set(
              existingActive
                .filter((t) => t && typeof t === 'object' && 'protocolId' in t)
                .map((t) => String((t as { protocolId: string | number }).protocolId)),
            )
            const activeProtocolsList = Array.from(activeProtocols).join(', ')
            const warningMessage =
              `Item ${itemIndex}: Patient ${processedTreatment.patientId} already has ${existingActive.length} active treatment(s) ` +
              `with protocol(s): ${activeProtocolsList}. Creating additional treatment may violate business rules.`
            console.warn(warningMessage)
            if (!continueOnError) {
              throw new ConflictException(
                `Bulk create failed at ${warningMessage}. Successfully created ${results.length} treatments.`,
              )
            }
          }

          const created = await this.patientTreatmentRepository.createPatientTreatment(processedTreatment)
          results.push(created)
        } catch (error: any) {
          const errorMessage = `Item ${itemIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMessage)
          if (!continueOnError) {
            throw new ConflictException(
              `Bulk create failed at ${errorMessage}. Successfully created ${results.length} treatments.`,
            )
          }
        }
      }
    }

    console.log(`Bulk create completed: ${results.length} treatments created, ${errors.length} errors`)
    if (errors.length > 0) {
      console.log('Errors:', errors)
    }
    return results
  }

  /**
   * Helper: parse và chuẩn hóa 1 treatment item trong bulk
   */
  private parseTreatmentItem(treatment: TreatmentItem, itemIndex: number, userId: number) {
    return {
      patientId: this.safeParseNumber(treatment.patientId, `patientId for item ${itemIndex}`),
      doctorId: this.safeParseNumber(treatment.doctorId, `doctorId for item ${itemIndex}`),
      protocolId: this.safeParseNumber(treatment.protocolId, `protocolId for item ${itemIndex}`),
      startDate: treatment.startDate
        ? typeof treatment.startDate === 'string' || typeof treatment.startDate === 'number'
          ? new Date(treatment.startDate)
          : treatment.startDate instanceof Date
            ? treatment.startDate
            : new Date()
        : new Date(),
      endDate:
        treatment.endDate !== undefined
          ? typeof treatment.endDate === 'string' || typeof treatment.endDate === 'number'
            ? new Date(treatment.endDate)
            : treatment.endDate instanceof Date
              ? treatment.endDate
              : undefined
          : undefined,
      notes: treatment.notes,
      total: Math.max(0, this.safeParseNumber(treatment.total || 0, `total for item ${itemIndex}`, 0)),
      customMedications: this.safeParseCustomMedications(treatment.customMedications, Number(itemIndex)),
      createdById: userId,
    }
  }

  private safeParseNumber(value: any, fieldName: string, defaultValue?: number): number {
    try {
      if (value === null || value === undefined) {
        if (defaultValue !== undefined) {
          return defaultValue
        }
        throw new Error(`${fieldName} is required`)
      }
      const parsed: number = typeof value === 'string' ? Number(value) : Number(value)
      if (isNaN(parsed) || !isFinite(parsed)) {
        throw new Error(`${fieldName} must be a valid number`)
      }
      return parsed
    } catch (error: any) {
      throw new BadRequestException(`Error parsing number for ${fieldName}: ${error.message}`)
    }
  }

  private safeParseCustomMedications(value: any, itemIndex: number): CustomMedicationType[] | null {
    try {
      if (!value) return null
      let meds = value
      if (typeof value === 'string') {
        meds = JSON.parse(value)
      }
      if (Array.isArray(meds)) {
        return meds.map((med) => ({
          medicineId: typeof med.medicineId === 'number' ? med.medicineId : undefined,
          medicineName: typeof med.medicineName === 'string' ? med.medicineName : '',
          dosage: typeof med.dosage === 'string' ? med.dosage : '',
          unit: typeof med.unit === 'string' ? med.unit : undefined,
          frequency: typeof med.frequency === 'string' ? med.frequency : '',
          time: typeof med.time === 'string' ? med.time : undefined,
          durationValue: typeof med.durationValue === 'number' ? med.durationValue : 1,
          durationUnit: typeof med.durationUnit === 'string' ? med.durationUnit : 'DAY',
          schedule: typeof med.schedule === 'string' ? med.schedule : undefined,
          notes: typeof med.notes === 'string' ? med.notes : undefined,
          price: typeof med.price === 'number' ? med.price : undefined,
        }))
      }
      return null
    } catch (error: any) {
      throw new BadRequestException(`Invalid custom medications format for item ${itemIndex}: ${error.message}`)
    }
  }
}
