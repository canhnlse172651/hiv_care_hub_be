import { BadRequestException, Injectable } from '@nestjs/common'
import { PatientTreatment } from '@prisma/client'
import { SharedErrorHandlingService } from 'src/shared/services/error-handling.service'
import { PatientTreatmentRepository } from '../../../repositories/patient-treatment.repository'
import { ENTITY_NAMES } from '../../../shared/constants/api.constants'
import { PaginatedResponse, type PaginationOptions } from '../../../shared/schemas/pagination.schema'
import { PaginationService } from '../../../shared/services/pagination.service'
import { GetPatientTreatmentsByPatientSchema, PatientTreatmentQuerySchema } from '../patient-treatment.model'
import { normalizeCustomMedicationsSchedule } from '../utils/custom-medications.utils'

@Injectable()
export class PatientTreatmentQueryService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly paginationService: PaginationService,
    private readonly errorHandlingService: SharedErrorHandlingService,
  ) {}

  async getAllPatientTreatments({
    page,
    limit,
  }: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      // If neither page nor limit is provided, return all records (up to MAX_SAFE_INTEGER)
      const isReturnAll = typeof page === 'undefined' && typeof limit === 'undefined'
      const options: PaginationOptions<PatientTreatment> = {
        page: isReturnAll ? 1 : Math.max(1, Number(page) || 1),
        limit: isReturnAll ? Number.MAX_SAFE_INTEGER : Math.min(100, Math.max(1, Number(limit) || 10)),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }
      // Lấy startDate và endDate từ params nếu có
      const where: any = {}
      if (typeof page === 'object' && page !== null) {
        const params = page as any
        const startDateStr = typeof params.startDate === 'string' ? params.startDate : undefined
        const endDateStr = typeof params.endDate === 'string' ? params.endDate : undefined
        const parsedStartDate = startDateStr ? new Date(String(startDateStr)) : undefined
        const parsedEndDate = endDateStr ? new Date(String(endDateStr)) : undefined
        const isValidStartDate = parsedStartDate && !isNaN(parsedStartDate.getTime())
        const isValidEndDate = parsedEndDate && !isNaN(parsedEndDate.getTime())
        if (isValidStartDate && isValidEndDate) {
          // Lọc các điều trị có thời gian giao với khoảng truy vấn
          where.startDate = { lte: parsedEndDate }
          where.endDate = { gte: parsedStartDate }
        } else if (isValidStartDate) {
          where.startDate = { gte: parsedStartDate }
        } else if (isValidEndDate) {
          where.endDate = { lte: parsedEndDate }
        }
      }
      const result = await this.paginationService.paginate<PatientTreatment>(
        this.patientTreatmentRepository.getPatientTreatmentModel(),
        options,
        where,
        this.getDefaultIncludes(),
      )
      // Normalize customMedications for all results
      result.data = Array.isArray(result.data) ? result.data.map((item) => this.normalizePatientTreatment(item)) : []
      return result
    } catch (error: any) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  private getDefaultIncludes() {
    return {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
      protocol: { include: { medicines: { include: { medicine: true } } } },
      createdBy: { select: { id: true, name: true, email: true } },
      testResults: {
        include: { test: true },
      },
    }
  }

  private normalizePatientTreatment = (item: PatientTreatment): PatientTreatment => {
    item.customMedications = normalizeCustomMedicationsSchedule(item.customMedications)
    return item
  }

  async getPatientTreatmentsByPatientId(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      const validatedQuery = GetPatientTreatmentsByPatientSchema.parse(query)
      const { patientId, page, limit, sortBy, sortOrder, includeCompleted, startDate, endDate } = validatedQuery
      const where: any = { patientId }
      if (startDate && typeof startDate === 'string') {
        const parsedStartDate = new Date(startDate)
        if (!isNaN(parsedStartDate.getTime())) {
          where.startDate = { gte: parsedStartDate }
        }
      }
      if (endDate && typeof endDate === 'string') {
        const parsedEndDate = new Date(endDate)
        if (!isNaN(parsedEndDate.getTime())) {
          where.endDate = { lte: parsedEndDate }
        }
      }
      const options = {
        page: Math.max(1, Number(page)),
        limit: Math.min(100, Math.max(1, Number(limit))),
        sortBy,
        sortOrder,
      }
      const result = await this.paginationService.paginate<PatientTreatment>(
        this.patientTreatmentRepository.getPatientTreatmentModel(),
        options,
        where,
        this.getDefaultIncludes(),
      )
      result.data = result.data.map(this.normalizePatientTreatment)
      return result
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        throw new BadRequestException(`Invalid query parameters: ${error.message}`)
      }
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  async getPatientTreatmentsByDoctorId(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      const validatedQuery = PatientTreatmentQuerySchema.parse(query)
      const { doctorId, page, limit, sortBy, sortOrder } = validatedQuery
      if (!doctorId) {
        throw new BadRequestException('Doctor ID is required')
      }
      const where = { doctorId: Number(doctorId) }
      const options = {
        page: Math.max(1, Number(page) || 1),
        limit: Math.min(100, Math.max(1, Number(limit) || 10)),
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      }
      const result = await this.paginationService.paginate<PatientTreatment>(
        this.patientTreatmentRepository.getPatientTreatmentModel(),
        options,
        where,
        this.getDefaultIncludes(),
      )
      result.data = result.data.map((item) => {
        item.customMedications = normalizeCustomMedicationsSchedule(item.customMedications)
        return item
      })
      return result
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        throw new BadRequestException(`Invalid query parameters: ${error.message}`)
      }
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  async searchPatientTreatments(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      if (!query || query.trim() === '') {
        const options = {
          page: Math.max(1, page),
          limit: Math.min(100, Math.max(1, limit)),
          sortBy: 'createdAt',
          sortOrder: 'desc' as const,
        }
        const result = await this.paginationService.paginate<PatientTreatment>(
          this.patientTreatmentRepository.getPatientTreatmentModel(),
          options,
          {}, // không filter
          {
            patient: { select: { id: true, name: true, email: true } },
            doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
            protocol: { include: { medicines: { include: { medicine: true } } } },
            createdBy: { select: { id: true, name: true, email: true } },
            testResults: {
              select: {
                id: true,
                rawResultValue: true,
                interpretation: true,
                cutOffValueUsed: true,
                notes: true,
                resultDate: true,
                status: true,
              },
            },
          },
        )
        result.data = result.data.map((item) => {
          item.customMedications = normalizeCustomMedicationsSchedule(item.customMedications)
          return item
        })
        return result
      }
      const validatedQuery = query.trim()
      const where: any = {
        OR: [
          { notes: { contains: validatedQuery, mode: 'insensitive' } },
          { patient: { name: { contains: validatedQuery, mode: 'insensitive' } } },
          { doctor: { user: { name: { contains: validatedQuery, mode: 'insensitive' } } } },
        ],
      }
      const options = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      }
      const result = await this.paginationService.paginate<PatientTreatment>(
        this.patientTreatmentRepository.getPatientTreatmentModel(),
        options,
        where,
        {
          patient: { select: { id: true, name: true, email: true } },
          doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
          protocol: { include: { medicines: { include: { medicine: true } } } },
          createdBy: { select: { id: true, name: true, email: true } },
          testResults: {
            select: {
              id: true,
              rawResultValue: true,
              interpretation: true,
              cutOffValueUsed: true,
              notes: true,
              resultDate: true,
              status: true,
            },
          },
        },
      )
      result.data = result.data.map((item) => {
        item.customMedications = normalizeCustomMedicationsSchedule(item.customMedications)
        return item
      })
      return result
    } catch (error: any) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }
}
