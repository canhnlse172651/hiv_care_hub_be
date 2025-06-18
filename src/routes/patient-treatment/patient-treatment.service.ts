import { Injectable } from '@nestjs/common'
import { PatientTreatment } from '@prisma/client'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { ENTITY_NAMES } from '../../shared/constants/api.constants'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { SharedErrorHandlingService } from '../../shared/services/error-handling.service'
import { PaginationService } from '../../shared/services/pagination.service'
import {
  BulkCreatePatientTreatment,
  CreatePatientTreatmentSchema,
  CustomMedicationsQuerySchema,
  GetPatientTreatmentsByPatientSchema,
  QueryPatientTreatmentSchema,
  UpdatePatientTreatment,
  BasicQueryPatientTreatmentSchema,
} from './patient-treatment.model'

@Injectable()
export class PatientTreatmentService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly paginationService: PaginationService,
    private readonly errorHandlingService: SharedErrorHandlingService,
  ) {}

  // Create new patient treatment - Enhanced with flexible validation
  async createPatientTreatment(data: any, userId: number): Promise<PatientTreatment> {
    try {
      // Enhanced validation - handle various input formats
      let validatedData

      try {
        // Ensure userId is a valid number
        if (!userId || typeof userId !== 'number' || userId <= 0) {
          throw new Error('Valid user ID is required')
        }

        // Apply flexible transformations before validation
        const flexibleData = {
          ...data,
          // Transform common string-number fields
          patientId: data.patientId ? Number(data.patientId) : undefined,
          doctorId: data.doctorId ? Number(data.doctorId) : undefined,
          protocolId: data.protocolId ? Number(data.protocolId) : undefined,
          // Transform date fields safely - ensure they are strings for Zod
          startDate: data.startDate ? String(data.startDate) : undefined,
          endDate: data.endDate ? String(data.endDate) : undefined,
          // Transform custom medications - ensure it's an object if provided
          customMedications: data.customMedications
            ? typeof data.customMedications === 'string'
              ? JSON.parse(String(data.customMedications))
              : data.customMedications
            : {},
        }

        validatedData = CreatePatientTreatmentSchema.parse(flexibleData)
      } catch (validationError) {
        console.error('Validation failed:', validationError)
        throw new Error(`Validation failed: ${validationError.message}`)
      }

      // Business rules validation
      const businessValidation = await this.patientTreatmentRepository.validatePatientTreatmentBusinessRules({
        patientId: validatedData.patientId,
        protocolId: validatedData.protocolId,
        doctorId: validatedData.doctorId,
        customMedications: validatedData.customMedications,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        total: validatedData.total,
      })

      if (!businessValidation.isValid) {
        throw new Error(`Business validation failed: ${businessValidation.errors.join(', ')}`)
      }

      // Log warnings if any
      if (businessValidation.warnings.length > 0) {
        console.warn('Patient treatment creation warnings:', businessValidation.warnings)
      }

      // Use calculated total if significantly different from provided
      const finalTotal =
        businessValidation.calculatedTotal &&
        validatedData.total > 0 &&
        Math.abs(validatedData.total - businessValidation.calculatedTotal) > validatedData.total * 0.1
          ? businessValidation.calculatedTotal
          : validatedData.total

      // Add createdById from authenticated user
      const treatmentData = {
        patientId: validatedData.patientId,
        protocolId: validatedData.protocolId,
        doctorId: validatedData.doctorId,
        customMedications: validatedData.customMedications,
        notes: validatedData.notes,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        total: finalTotal,
        createdById: userId,
      }

      return this.patientTreatmentRepository.createPatientTreatment(treatmentData)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Delete patient treatment
  async deletePatientTreatment(id: number): Promise<PatientTreatment> {
    // Check if treatment exists
    await this.getPatientTreatmentById(id)

    return this.patientTreatmentRepository.deletePatientTreatment(id)
  }

  // Get all patient treatments with pagination and filtering
  async getAllPatientTreatments(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      // Validate query with proper schema
      const validatedQuery = BasicQueryPatientTreatmentSchema.parse(query)
      console.log('getAllPatientTreatments - Validated query:', validatedQuery)

      const { page, limit, search, sortBy, sortOrder, startDate, endDate } = validatedQuery

      // Build where clause with type-safe approach
      const where: {
        AND?: Array<{
          OR?: Array<{
            notes?: { contains: string; mode: 'insensitive' }
            patient?: { name: { contains: string; mode: 'insensitive' } }
            doctor?: { user: { name: { contains: string; mode: 'insensitive' } } }
            protocol?: { name: { contains: string; mode: 'insensitive' } }
          }>
          startDate?: { gte: Date }
          endDate?: { lte: Date }
        }>
      } = {}

      const whereConditions: Array<any> = []

      // Handle search across multiple fields if provided
      if (search?.trim()) {
        whereConditions.push({
          OR: [
            { notes: { contains: search, mode: 'insensitive' } },
            { patient: { name: { contains: search, mode: 'insensitive' } } },
            { doctor: { user: { name: { contains: search, mode: 'insensitive' } } } },
            { protocol: { name: { contains: search, mode: 'insensitive' } } },
          ],
        } as const)
      }

      // Add date range filters if provided
      if (startDate) {
        const parsedStartDate = new Date(startDate)
        if (!isNaN(parsedStartDate.getTime())) {
          whereConditions.push({ startDate: { gte: parsedStartDate } })
        }
      }

      if (endDate) {
        const parsedEndDate = new Date(endDate)
        if (!isNaN(parsedEndDate.getTime())) {
          whereConditions.push({ endDate: { lte: parsedEndDate } })
        }
      }

      // Add AND conditions if we have any
      if (whereConditions.length > 0) {
        where.AND = whereConditions
      }

      const options = {
        page: Math.max(1, Number(page)),
        limit: Math.min(100, Math.max(1, Number(limit))), // Cap at 100 items per page
        sortBy,
        sortOrder,
      }

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
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new Error(`Invalid query parameters: ${error.message}`)
      }
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Get patient treatments by patient ID with pagination and filtering
  async getPatientTreatmentsByPatientId(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      // Validate query with patient-specific schema
      const validatedQuery = GetPatientTreatmentsByPatientSchema.parse(query)
      const { patientId, page, limit, sortBy, sortOrder, includeCompleted, startDate, endDate } = validatedQuery

      // Build where clause
      const where: any = {
        patientId: patientId,
      }

      // Add date filters if provided
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
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new Error(`Invalid query parameters: ${error.message}`)
      }
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Get patient treatments by doctor ID
  async getPatientTreatmentsByDoctorId(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      // Validate query with doctor-specific schema (we're using the generic one for now)
      const validatedQuery = QueryPatientTreatmentSchema.parse(query)
      const { doctorId, page, limit, sortBy, sortOrder } = validatedQuery

      if (!doctorId) {
        throw new Error('Doctor ID is required')
      }

      const where = {
        doctorId: Number(doctorId),
      }

      const options = {
        page: Math.max(1, Number(page) || 1),
        limit: Math.min(100, Math.max(1, Number(limit) || 10)),
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      }

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
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      )
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new Error(`Invalid query parameters: ${error.message}`)
      }
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // ===============================
  // ENHANCED SEARCH AND FLEXIBLE QUERIES
  // ===============================

  // Enhanced search with flexible query handling
  async searchPatientTreatments(query: string, searchFields?: string[]): Promise<PatientTreatment[]> {
    // Handle empty or invalid queries
    if (!query || query.trim() === '') {
      return []
    }

    // Use provided search fields or default ones
    const fieldsToSearch = searchFields || ['notes', 'customMedications']

    // Try multiple search strategies
    try {
      // First try exact search
      return await this.patientTreatmentRepository.searchPatientTreatments(query.trim())
    } catch (error) {
      console.log('Exact search failed, trying flexible search:', error)

      // Try flexible search by parsing the query
      const searchTerms = query.trim().split(/\s+/)
      let results: PatientTreatment[] = []

      for (const term of searchTerms) {
        try {
          const termResults = await this.patientTreatmentRepository.searchPatientTreatments(term)
          results = [...results, ...termResults]
        } catch (termError) {
          console.log(`Search term "${term}" failed:`, termError)
        }
      }

      // Remove duplicates
      const uniqueResults = results.filter(
        (treatment, index, self) => index === self.findIndex((t) => t.id === treatment.id),
      )

      return uniqueResults
    }
  }

  // Enhanced date range search with flexible date handling
  async getPatientTreatmentsByDateRange(startDate: Date, endDate: Date): Promise<PatientTreatment[]> {
    // Handle invalid dates gracefully
    let validStartDate = startDate
    let validEndDate = endDate

    if (!startDate || isNaN(startDate.getTime())) {
      validStartDate = new Date()
      validStartDate.setFullYear(validStartDate.getFullYear() - 1) // Default to 1 year ago
    }

    if (!endDate || isNaN(endDate.getTime())) {
      validEndDate = new Date() // Default to now
    }

    // Ensure startDate is before endDate
    if (validStartDate > validEndDate) {
      ;[validStartDate, validEndDate] = [validEndDate, validStartDate]
    }

    try {
      return await this.patientTreatmentRepository.getPatientTreatmentsByDateRange(validStartDate, validEndDate)
    } catch (error) {
      console.log('Date range search failed, returning empty array:', error)
      return []
    }
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

    const page = Math.max(1, validatedQuery.page || 1)
    const limit = Math.min(100, Math.max(1, validatedQuery.limit || 10)) // Limit between 1-100
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

    // Get total count for accurate pagination - this should be implemented in repository
    // For now, we'll estimate based on the returned data
    const hasNextPage = data.length === limit
    const totalPages = hasNextPage ? page + 1 : page // Conservative estimate

    return {
      data,
      meta: {
        total: data.length, // This is not accurate but works for now
        page,
        limit,
        totalPages,
        hasNextPage,
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
    const results: PatientTreatment[] = []
    const errors: string[] = []

    const batchSize = Math.min(10, Math.max(1, data.items.length)) // Ensure valid batch size
    const continueOnError = data.continueOnError || false
    const validateBeforeCreate = data.validateBeforeCreate !== false // Default true

    // Validate input
    if (!data.items || data.items.length === 0) {
      throw new Error('No treatment items provided for bulk creation')
    }

    // Process treatments in batches
    for (let i = 0; i < data.items.length; i += batchSize) {
      const batch = data.items.slice(i, i + batchSize)

      for (const [batchIndex, treatment] of batch.entries()) {
        const itemIndex = i + batchIndex + 1
        try {
          // Flexible data transformation with better error handling
          const processedTreatment = {
            patientId: this.safeParseNumber(treatment.patientId, `patientId for item ${itemIndex}`),
            doctorId: this.safeParseNumber(treatment.doctorId, `doctorId for item ${itemIndex}`),
            protocolId: this.safeParseNumber(treatment.protocolId, `protocolId for item ${itemIndex}`),
            startDate: typeof treatment.startDate === 'string' ? new Date(treatment.startDate) : treatment.startDate,
            endDate: treatment.endDate
              ? typeof treatment.endDate === 'string'
                ? new Date(treatment.endDate)
                : treatment.endDate
              : undefined,
            notes: treatment.notes,
            total: Math.max(0, this.safeParseNumber((treatment as any).total || 0, `total for item ${itemIndex}`, 0)), // Ensure non-negative
            customMedications: this.safeParseCustomMedications(treatment.customMedications, itemIndex),
            createdById: userId,
          }

          // Validate processed data if requested
          if (validateBeforeCreate) {
            CreatePatientTreatmentSchema.parse(processedTreatment)
          }

          // Create the treatment record
          const created = await this.patientTreatmentRepository.createPatientTreatment(processedTreatment)
          results.push(created)
        } catch (error) {
          const errorMessage = `Item ${itemIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMessage)

          if (!continueOnError) {
            throw new Error(`Bulk create failed at ${errorMessage}. Successfully created ${results.length} treatments.`)
          }
        }
      }
    }

    // Log summary
    console.log(`Bulk create completed: ${results.length} treatments created, ${errors.length} errors`)
    if (errors.length > 0) {
      console.log('Errors:', errors)
    }

    return results
  }

  // Helper methods for bulk create
  private safeParseNumber(value: any, fieldName: string, defaultValue?: number): number {
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
  }

  private safeParseCustomMedications(value: any, itemIndex: number): any {
    if (!value) return null

    try {
      if (Array.isArray(value)) {
        return value
      }
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    } catch (error) {
      throw new Error(`Invalid custom medications format for item ${itemIndex}`)
    }
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

    // Safe division to avoid divide by zero
    const totalTreatments = stats.totalTreatments || 0
    const completedTreatments = stats.completedTreatments || 0
    const activeTreatments = stats.activeTreatments || 0

    const complianceRate = totalTreatments > 0 ? (completedTreatments / totalTreatments) * 100 : 0

    return {
      totalTreatments,
      completedTreatments,
      activeTreatments,
      droppedTreatments: Math.max(0, totalTreatments - completedTreatments - activeTreatments),
      complianceRate: Math.round(complianceRate * 100) / 100, // Round to 2 decimal places
      averageTreatmentDuration: stats.averageTreatmentDuration,
    }
  }

  async getTreatmentCostAnalysis(params: {
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
    try {
      return await this.patientTreatmentRepository.getTreatmentCostAnalysis(params)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }
}
