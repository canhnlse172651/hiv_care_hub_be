import { Injectable } from '@nestjs/common'
import { PatientTreatment } from '@prisma/client'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { PaginationService } from '../../shared/services/pagination.service'
import { SharedErrorHandlingService } from '../../shared/services/error-handling.service'
import { ENTITY_NAMES, RESPONSE_MESSAGES } from '../../shared/constants/api.constants'
import {
  CreatePatientTreatmentSchema,
  GetPatientTreatmentsByPatientSchema,
  QueryPatientTreatmentSchema,
  UpdatePatientTreatment,
  BulkCreatePatientTreatment,
  CreatePatientTreatment,
  CustomMedicationsQuerySchema,
} from './patient-treatment.model'

@Injectable()
export class PatientTreatmentService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly paginationService: PaginationService,
    private readonly errorHandlingService: SharedErrorHandlingService,
  ) {}

  // Create new patient treatment
  async createPatientTreatment(data: any, userId: number): Promise<PatientTreatment> {
    try {
      // Validate data with proper schema
      const validatedData = CreatePatientTreatmentSchema.parse(data)

      // Add createdById from authenticated user
      const treatmentData = {
        ...validatedData,
        createdById: userId,
      }

      return this.patientTreatmentRepository.createPatientTreatment(treatmentData)
    } catch (error) {
      this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Get patient treatment by ID
  async getPatientTreatmentById(id: number): Promise<PatientTreatment> {
    const validatedId = this.errorHandlingService.validateId(id)
    const treatment = await this.patientTreatmentRepository.findPatientTreatmentById(validatedId)
    return this.errorHandlingService.validateEntityExists(treatment, ENTITY_NAMES.PATIENT_TREATMENT, validatedId)
  }

  // Update patient treatment
  async updatePatientTreatment(id: number, data: UpdatePatientTreatment): Promise<PatientTreatment> {
    try {
      // Check if treatment exists
      await this.getPatientTreatmentById(id)

      return this.patientTreatmentRepository.updatePatientTreatment(id, data)
    } catch (error) {
      this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }

    return this.patientTreatmentRepository.updatePatientTreatment(id, data)
  }

  // Delete patient treatment
  async deletePatientTreatment(id: number): Promise<PatientTreatment> {
    // Check if treatment exists
    await this.getPatientTreatmentById(id)

    return this.patientTreatmentRepository.deletePatientTreatment(id)
  }

  // Get all patient treatments with pagination and filtering
  async getAllPatientTreatments(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    // Validate query with proper schema
    const validatedQuery = QueryPatientTreatmentSchema.parse(query)
    console.log('getAllPatientTreatments - Validated query:', validatedQuery)

    const { page, limit, patientId, doctorId, protocolId, startDate, endDate, sortBy, sortOrder } = validatedQuery

    // Build where clause
    const where: any = {}

    if (patientId) {
      where.patientId = patientId
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (protocolId) {
      where.protocolId = protocolId
    }

    if (startDate || endDate) {
      where.startDate = {}
      if (startDate) {
        where.startDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate)
      }
    }

    const options = { page, limit, sortBy, sortOrder }

    return this.paginationService.paginate<PatientTreatment>(
      this.patientTreatmentRepository.getPatientTreatmentModel(),
      options,
      where,
      {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        protocol: {
          include: {
            medicines: {
              include: {
                medicine: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    )
  }

  // Get patient treatments by patient ID
  async getPatientTreatmentsByPatientId(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    // Validate query with proper schema
    const validatedQuery = GetPatientTreatmentsByPatientSchema.parse(query)
    console.log('getPatientTreatmentsByPatientId - Validated query:', validatedQuery)

    const { patientId, page, limit } = validatedQuery

    const where = {
      patientId: patientId,
    }

    const options = { page, limit, sortBy: 'createdAt' as const, sortOrder: 'desc' as const }

    return this.paginationService.paginate<PatientTreatment>(
      this.patientTreatmentRepository.getPatientTreatmentModel(),
      options,
      where,
      {
        protocol: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
    )
  }

  // Get patient treatments by doctor ID
  async getPatientTreatmentsByDoctorId(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    // For now, use a similar approach to patient query
    // We could create a specific schema for doctor queries if needed
    const validatedQuery = QueryPatientTreatmentSchema.parse(query)
    console.log('getPatientTreatmentsByDoctorId - Validated query:', validatedQuery)

    const { doctorId, page, limit, sortBy, sortOrder } = validatedQuery

    if (!doctorId) {
      throw new Error('Doctor ID is required')
    }

    const where = {
      doctorId: doctorId,
    }

    const options = { page, limit, sortBy, sortOrder }

    return this.paginationService.paginate<PatientTreatment>(
      this.patientTreatmentRepository.getPatientTreatmentModel(),
      options,
      where,
      {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        protocol: true,
      },
    )
  }

  // ===============================
  // SEARCH AND ADVANCED QUERIES
  // ===============================

  async searchPatientTreatments(query: string): Promise<PatientTreatment[]> {
    return this.patientTreatmentRepository.searchPatientTreatments(query)
  }

  async getPatientTreatmentsByDateRange(startDate: Date, endDate: Date): Promise<PatientTreatment[]> {
    return this.patientTreatmentRepository.getPatientTreatmentsByDateRange(startDate, endDate)
  }

  async getActivePatientTreatments(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    // Validate query for pagination
    const validatedQuery = QueryPatientTreatmentSchema.parse(query)
    const { page, limit } = validatedQuery

    // Calculate skip and take for pagination
    const skip = (page - 1) * limit
    const take = limit

    // Get active treatments from repository
    const activePatientTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
      skip,
      take,
      orderBy: { startDate: 'desc' },
    })

    // Count total active treatments
    const totalActive = await this.patientTreatmentRepository.countPatientTreatments({
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
    })

    // Build pagination metadata
    const totalPages = Math.ceil(totalActive / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return {
      data: activePatientTreatments,
      meta: {
        total: totalActive,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    }
  }

  async findTreatmentsWithCustomMedications(query: any): Promise<PaginatedResponse<PatientTreatment>> {
    // Parse and validate the query using CustomMedicationsQuerySchema instead
    const validatedQuery = CustomMedicationsQuerySchema.parse(query)

    const page = validatedQuery.page || 1
    const limit = validatedQuery.limit || 10
    const skip = (page - 1) * limit

    // Convert dates if provided
    const params = {
      patientId: validatedQuery.patientId,
      doctorId: validatedQuery.doctorId,
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      skip,
      take: limit,
    }

    // Use the repository method directly which already handles the JSON filter correctly
    const data = await this.patientTreatmentRepository.findTreatmentsWithCustomMedications(params)

    // For count, we need to approximate since the repository method doesn't provide total
    // In a real implementation, you'd add a count method to the repository
    const totalPages = Math.ceil(data.length / limit) || 1

    return {
      data,
      meta: {
        total: data.length, // This is not accurate but works for now
        page,
        limit,
        totalPages,
        hasNextPage: data.length === limit, // Approximate
        hasPreviousPage: page > 1,
      },
    }
  }

  // ===============================
  // STATISTICS AND ANALYTICS
  // ===============================

  async getPatientTreatmentStats(patientId: number): Promise<any> {
    return this.patientTreatmentRepository.getPatientTreatmentStats(patientId)
  }

  async getDoctorWorkloadStats(doctorId: number): Promise<any> {
    return this.patientTreatmentRepository.getDoctorWorkloadStats(doctorId)
  }

  async getCustomMedicationStats(): Promise<{
    totalTreatments: number
    treatmentsWithCustomMeds: number
    customMedicationUsageRate: number
    topCustomMedicines: Array<{
      medicineId: number
      medicineName: string
      usageCount: number
    }>
  }> {
    return this.patientTreatmentRepository.getCustomMedicationStats()
  }

  async compareProtocolVsCustomTreatments(protocolId: number): Promise<{
    protocol: any
    standardTreatments: {
      count: number
      averageDuration: number | null
      averageCost: number
      completionRate: number
    }
    customTreatments: {
      count: number
      averageDuration: number | null
      averageCost: number
      completionRate: number
    }
    customizationRate: number
  }> {
    return this.patientTreatmentRepository.compareProtocolVsCustomTreatments(protocolId)
  }

  async bulkCreatePatientTreatments(data: BulkCreatePatientTreatment, userId: number): Promise<PatientTreatment[]> {
    const treatmentsWithUserId = data.treatments.map((treatment) => {
      const processedTreatment = {
        ...treatment,
        startDate: typeof treatment.startDate === 'string' ? new Date(treatment.startDate) : treatment.startDate,
        endDate: treatment.endDate
          ? typeof treatment.endDate === 'string'
            ? new Date(treatment.endDate)
            : treatment.endDate
          : undefined,
        createdById: userId,
      }
      return processedTreatment
    })

    return this.patientTreatmentRepository.bulkCreatePatientTreatments(treatmentsWithUserId)
  }

  // Additional utility methods

  async getTreatmentComplianceStats(patientId: number): Promise<{
    totalTreatments: number
    completedTreatments: number
    activeTreatments: number
    droppedTreatments: number
    complianceRate: number
    averageTreatmentDuration: number | null
  }> {
    const stats = await this.getPatientTreatmentStats(patientId)

    return {
      totalTreatments: stats.totalTreatments,
      completedTreatments: stats.completedTreatments,
      activeTreatments: stats.activeTreatments,
      droppedTreatments: stats.totalTreatments - stats.completedTreatments - stats.activeTreatments,
      complianceRate: stats.totalTreatments > 0 ? (stats.completedTreatments / stats.totalTreatments) * 100 : 0,
      averageTreatmentDuration: stats.averageTreatmentDuration,
    }
  }

  getTreatmentCostAnalysis(params: {
    patientId?: number
    doctorId?: number
    protocolId?: number
    startDate?: Date
    endDate?: Date
  }): Promise<{
    totalCost: number
    averageCostPerTreatment: number
    costBreakdown: {
      standardProtocolCosts: number
      customMedicationCosts: number
    }
    costTrends: Array<{
      month: string
      totalCost: number
      treatmentCount: number
    }>
  }> {
    // This would need repository support for cost analysis
    // For now, return basic structure
    return Promise.resolve({
      totalCost: 0,
      averageCostPerTreatment: 0,
      costBreakdown: {
        standardProtocolCosts: 0,
        customMedicationCosts: 0,
      },
      costTrends: [],
    })
  }
}
