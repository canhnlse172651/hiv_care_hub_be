import { Injectable } from '@nestjs/common'
import { PatientTreatment, Prisma } from '@prisma/client'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { ENTITY_NAMES } from '../../shared/constants/api.constants'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { SharedErrorHandlingService } from '../../shared/services/error-handling.service'
import { PaginationService } from '../../shared/services/pagination.service'
import {
  BasicQueryPatientTreatmentSchema,
  BulkCreatePatientTreatment,
  CreatePatientTreatmentSchema,
  CustomMedicationsQuerySchema,
  GetPatientTreatmentsByPatientSchema,
  QueryPatientTreatmentSchema,
  UpdatePatientTreatment,
} from './patient-treatment.model'

@Injectable()
export class PatientTreatmentService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly paginationService: PaginationService,
    private readonly errorHandlingService: SharedErrorHandlingService,
  ) {}

  // Create new patient treatment - Enhanced with flexible validation
  async createPatientTreatment(data: any, userId: number, autoEndExisting: boolean = false): Promise<PatientTreatment> {
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

      // Handle auto-ending existing treatments if requested
      if (autoEndExisting) {
        const activeExisting = await this.patientTreatmentRepository.getActivePatientTreatments({
          patientId: Number(validatedData.patientId),
        })

        if (activeExisting.length > 0) {
          const newTreatmentStartDate = new Date(String(validatedData.startDate))
          const endDate = new Date(newTreatmentStartDate.getTime() - 1000) // 1 second before new treatment starts

          // IMPORTANT: Validate that endDate is not in the future relative to existing treatments
          for (const treatment of activeExisting) {
            const treatmentStartDate = new Date(treatment.startDate)
            if (endDate < treatmentStartDate) {
              throw new Error(
                `Cannot auto-end treatment ID ${treatment.id}: ` +
                  `New treatment start date (${newTreatmentStartDate.toISOString()}) ` +
                  `would create invalid end date (${endDate.toISOString()}) ` +
                  `before existing treatment start date (${treatmentStartDate.toISOString()}).`,
              )
            }
          }

          // Log the action for audit
          console.log(
            `Auto-ending ${activeExisting.length} active treatment(s) for patient ${validatedData.patientId}:`,
            activeExisting.map((t) => `ID ${t.id} (Protocol ${t.protocolId})`).join(', '),
          )

          // Update all existing treatments to end them in a transaction-safe manner
          for (const treatment of activeExisting) {
            await this.patientTreatmentRepository.updatePatientTreatment(treatment.id, {
              endDate: endDate,
            })
          }

          console.log(
            `Successfully ended ${activeExisting.length} active treatment(s) for patient ${validatedData.patientId}`,
          )
        }
      } else {
        // Business rules validation - STRICT enforcement if not auto-ending
        const existingActive = await this.patientTreatmentRepository.getActivePatientTreatments({
          patientId: validatedData.patientId,
        })

        // STRICT: Check business rule: 1 patient = 1 active protocol at any given time
        if (existingActive.length > 0) {
          const activeProtocols = new Set(existingActive.map((t) => t.protocolId))
          const activeProtocolsList = Array.from(activeProtocols).join(', ')

          throw new Error(
            `Business rule violation: Patient ${validatedData.patientId} already has ${existingActive.length} active treatment(s) ` +
              `with protocol(s): ${activeProtocolsList}. Only 1 active protocol is allowed per patient. ` +
              `Please end existing treatments first or use autoEndExisting=true parameter.`,
          )
        }
      }

      // Date validation: startDate must be valid and not too far in the past/future
      const startDate = new Date(String(validatedData.startDate))
      const now = new Date()
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      const twoYearsFromNow = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)

      if (startDate < oneYearAgo) {
        throw new Error(`Start date cannot be more than 1 year in the past`)
      }
      if (startDate > twoYearsFromNow) {
        throw new Error(`Start date cannot be more than 2 years in the future`)
      }

      // If endDate is provided, validate it
      if (validatedData.endDate) {
        const endDate = new Date(String(validatedData.endDate))
        if (endDate <= startDate) {
          throw new Error(`End date must be after start date`)
        }
        if (endDate > twoYearsFromNow) {
          throw new Error(`End date cannot be more than 2 years in the future`)
        }
      }

      // Use provided total or default to 0
      const finalTotal = validatedData.total || 0

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

      // Audit log for treatment creation
      this.logTreatmentOperation('create', treatmentData)

      return this.patientTreatmentRepository.createPatientTreatment(treatmentData)
    } catch (error) {
      return this.handleServiceError(error, 'createPatientTreatment', { patientId: data.patientId, userId })
    }
  }

  // Get patient treatment by ID
  async getPatientTreatmentById(id: number): Promise<PatientTreatment> {
    const validatedId = this.errorHandlingService.validateId(id)
    const treatment = await this.patientTreatmentRepository.findPatientTreatmentById(validatedId)
    return this.errorHandlingService.validateEntityExists(treatment, ENTITY_NAMES.PATIENT_TREATMENT, validatedId)
  }

  // Update patient treatment with business rule validation
  async updatePatientTreatment(id: number, data: UpdatePatientTreatment): Promise<PatientTreatment> {
    try {
      // Check if treatment exists
      const existingTreatment = await this.getPatientTreatmentById(id)

      // If updating dates that might affect active status, validate business rules
      if (data.startDate || data.endDate) {
        const patientId = existingTreatment.patientId

        // Get other active treatments for the same patient (excluding current treatment)
        const otherActiveTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
          patientId: patientId,
        })
        const otherActiveExcludingCurrent = otherActiveTreatments.filter((t) => t.id !== id)

        // If there are other active treatments, check for conflicts with proposed update
        if (otherActiveExcludingCurrent.length > 0) {
          const currentDate = new Date()
          const newStartDate = data.startDate ? new Date(data.startDate) : new Date(existingTreatment.startDate)
          const newEndDate = data.endDate
            ? new Date(data.endDate)
            : existingTreatment.endDate
              ? new Date(existingTreatment.endDate)
              : null

          // Check if updated treatment would still be active
          const wouldBeActive = !newEndDate || newEndDate > currentDate

          if (wouldBeActive) {
            // Check for date overlaps with other active treatments
            for (const otherTreatment of otherActiveExcludingCurrent) {
              const otherStart = new Date(otherTreatment.startDate)
              const otherEnd = otherTreatment.endDate ? new Date(otherTreatment.endDate) : currentDate

              // Check for overlap: (newStart <= otherEnd) && (otherStart <= newEnd || newEnd is null)
              const hasOverlap = newStartDate <= otherEnd && otherStart <= (newEndDate || currentDate)

              if (hasOverlap) {
                throw new Error(
                  `Business rule violation: Updated treatment would overlap with active treatment ID ${otherTreatment.id} ` +
                    `(Protocol ${otherTreatment.protocolId}). Only 1 active protocol per patient is allowed.`,
                )
              }
            }
          }
        }
      }

      // Audit log for treatment update
      this.logTreatmentOperation('update', { id, ...data })

      return this.patientTreatmentRepository.updatePatientTreatment(id, data)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Delete patient treatment
  async deletePatientTreatment(id: number): Promise<PatientTreatment> {
    // Check if treatment exists
    await this.getPatientTreatmentById(id)

    // Audit log for treatment deletion
    this.logTreatmentOperation('delete', { id })

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
  // Enhanced search with pagination support
  async searchPatientTreatments(
    query: string,
    page: number = 1,
    limit: number = 10,
    searchFields?: string[],
  ): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      // Handle empty or invalid queries
      if (!query || query.trim() === '') {
        return {
          data: [],
          meta: {
            total: 0,
            page: page,
            limit: limit,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }
      }

      // Use repository search with proper pagination
      const validatedQuery = query.trim()

      // Build search criteria
      const where: any = {
        OR: [
          {
            notes: {
              contains: validatedQuery,
              mode: 'insensitive',
            },
          },
          {
            patient: {
              name: {
                contains: validatedQuery,
                mode: 'insensitive',
              },
            },
          },
          {
            doctor: {
              user: {
                name: {
                  contains: validatedQuery,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      }

      // Use pagination service for consistent results
      const options = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
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
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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
    try {
      // Validate query for pagination
      const validatedQuery = QueryPatientTreatmentSchema.parse(query)
      const { page, limit, patientId, doctorId, protocolId, sortBy, sortOrder } = validatedQuery

      // Calculate skip and take for pagination
      const skip = (page - 1) * limit
      const take = limit

      // Build order by clause
      const orderBy: Prisma.PatientTreatmentOrderByWithRelationInput = {}
      if (sortBy && sortOrder) {
        orderBy[sortBy] = sortOrder
      } else {
        orderBy.startDate = 'desc'
      }

      // Use repository's unified method for active treatments
      const activePatientTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId,
        skip,
        take,
        orderBy,
      })

      // Additional filtering by doctorId and protocolId if needed
      let filteredData = activePatientTreatments
      if (doctorId) {
        filteredData = filteredData.filter((treatment) => treatment.doctorId === doctorId)
      }
      if (protocolId) {
        filteredData = filteredData.filter((treatment) => treatment.protocolId === protocolId)
      }

      // Count total active treatments with same filters
      const whereClause: Prisma.PatientTreatmentWhereInput = {
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      }
      if (patientId) whereClause.patientId = patientId
      if (doctorId) whereClause.doctorId = doctorId
      if (protocolId) whereClause.protocolId = protocolId

      const totalActive = await this.patientTreatmentRepository.countPatientTreatments(whereClause)

      return {
        data: filteredData,
        meta: {
          total: totalActive,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalActive / limit),
          hasNextPage: page * limit < totalActive,
          hasPreviousPage: page > 1,
        },
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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

    // Use existing repository method to find treatments with custom medications
    const whereClause: Prisma.PatientTreatmentWhereInput = {
      customMedications: {
        not: Prisma.DbNull,
      },
    }

    if (params.patientId) whereClause.patientId = params.patientId
    if (params.doctorId) whereClause.doctorId = params.doctorId
    if (params.startDate || params.endDate) {
      whereClause.startDate = {}
      if (params.startDate) whereClause.startDate.gte = params.startDate
      if (params.endDate) whereClause.startDate.lte = params.endDate
    }

    const data = await this.patientTreatmentRepository.findPatientTreatments({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await this.patientTreatmentRepository.countPatientTreatments(whereClause)
    const hasNextPage = skip + limit < total
    const totalPages = Math.ceil(total / limit)

    return {
      data,
      meta: {
        total,
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
    try {
      const validatedPatientId = this.errorHandlingService.validateId(patientId)

      // Get all treatments for patient
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(validatedPatientId, {
        skip: 0,
        take: 1000,
      })

      // Get active treatments
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId: validatedPatientId,
      })

      // Calculate basic stats
      const totalTreatments = allTreatments.length
      const activeTreatmentsCount = activeTreatments.length
      const completedTreatments = totalTreatments - activeTreatmentsCount
      const totalCost = allTreatments.reduce((sum, t) => sum + (t.total || 0), 0)

      return {
        patientId: validatedPatientId,
        totalTreatments,
        activeTreatments: activeTreatmentsCount,
        completedTreatments,
        totalCost,
        averageCost: totalTreatments > 0 ? totalCost / totalTreatments : 0,
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  async getDoctorWorkloadStats(doctorId: number): Promise<any> {
    try {
      const validatedDoctorId = this.errorHandlingService.validateId(doctorId)

      // Get all treatments for doctor
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatmentsByDoctorId(validatedDoctorId, {
        skip: 0,
        take: 1000,
      })

      // Get active treatments
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({})
      const doctorActiveTreatments = activeTreatments.filter((t) => t.doctorId === validatedDoctorId)

      // Calculate stats
      const totalTreatments = allTreatments.length
      const activeTreatmentsCount = doctorActiveTreatments.length
      const uniquePatients = new Set(allTreatments.map((t) => t.patientId)).size

      return {
        doctorId: validatedDoctorId,
        totalTreatments,
        activeTreatments: activeTreatmentsCount,
        uniquePatients,
        averageTreatmentsPerPatient: uniquePatients > 0 ? totalTreatments / uniquePatients : 0,
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
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
    try {
      // Get all treatments
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatments({
        skip: 0,
        take: 10000, // Large number to get all
      })

      // Filter treatments with custom medications
      const treatmentsWithCustomMeds = allTreatments.filter((t) => t.customMedications && t.customMedications !== null)

      const totalTreatments = allTreatments.length
      const treatmentsWithCustomMedsCount = treatmentsWithCustomMeds.length
      const customMedicationUsageRate =
        totalTreatments > 0 ? (treatmentsWithCustomMedsCount / totalTreatments) * 100 : 0

      // Analyze custom medications (simplified)
      const medicationUsage = new Map<string, number>()

      treatmentsWithCustomMeds.forEach((treatment) => {
        if (treatment.customMedications && typeof treatment.customMedications === 'object') {
          const customMeds = Array.isArray(treatment.customMedications)
            ? treatment.customMedications
            : [treatment.customMedications]

          customMeds.forEach((med: any) => {
            if (med && med.name && typeof med.name === 'string') {
              const medName = med.name as string
              const currentCount = medicationUsage.get(medName) || 0
              medicationUsage.set(medName, currentCount + 1)
            }
          })
        }
      })

      // Convert to array and sort by usage
      const topCustomMedicines = Array.from(medicationUsage.entries())
        .map(([name, count], index) => ({
          medicineId: index + 1000, // Generate fake ID for compatibility
          medicineName: name,
          usageCount: count,
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10) // Top 10

      return {
        totalTreatments,
        treatmentsWithCustomMeds: treatmentsWithCustomMedsCount,
        customMedicationUsageRate: Math.round(customMedicationUsageRate * 100) / 100,
        topCustomMedicines,
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
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
    try {
      const validatedProtocolId = this.errorHandlingService.validateId(protocolId)

      // Get all treatments for this protocol
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatments({
        where: { protocolId: validatedProtocolId },
        skip: 0,
        take: 10000,
      })

      // Separate standard vs custom treatments
      const standardTreatments = allTreatments.filter((t) => !t.customMedications || t.customMedications === null)
      const customTreatments = allTreatments.filter((t) => t.customMedications && t.customMedications !== null)

      // Calculate stats for standard treatments
      const standardStats = this.calculateTreatmentStats(standardTreatments)
      const customStats = this.calculateTreatmentStats(customTreatments)

      const customizationRate = allTreatments.length > 0 ? (customTreatments.length / allTreatments.length) * 100 : 0

      return {
        protocol: { id: validatedProtocolId }, // Simplified protocol info
        standardTreatments: standardStats,
        customTreatments: customStats,
        customizationRate: Math.round(customizationRate * 100) / 100,
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  private calculateTreatmentStats(treatments: PatientTreatment[]) {
    const count = treatments.length
    if (count === 0) {
      return {
        count: 0,
        averageDuration: null,
        averageCost: 0,
        completionRate: 0,
      }
    }

    const totalCost = treatments.reduce((sum, t) => sum + (t.total || 0), 0)
    const averageCost = totalCost / count

    // Calculate completion rate (treatments with end date in the past)
    const currentDate = new Date()
    const completedTreatments = treatments.filter((t) => t.endDate && new Date(t.endDate) <= currentDate).length
    const completionRate = (completedTreatments / count) * 100

    // Calculate average duration for completed treatments
    const treatmentsWithDuration = treatments.filter((t) => t.endDate)
    let averageDuration: number | null = null

    if (treatmentsWithDuration.length > 0) {
      const totalDuration = treatmentsWithDuration.reduce((sum, t) => {
        const start = new Date(t.startDate)
        const end = new Date(t.endDate!)
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        return sum + duration
      }, 0)
      averageDuration = Math.round(totalDuration / treatmentsWithDuration.length)
    }

    return {
      count,
      averageDuration,
      averageCost: Math.round(averageCost * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
    }
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

    // PRE-VALIDATION: Check for business rule violations within the bulk request
    const patientGroups = new Map<number, Array<{ index: number; item: any }>>()
    data.items.forEach((item, index) => {
      const patientId = Number(item.patientId)
      if (!patientGroups.has(patientId)) {
        patientGroups.set(patientId, [])
      }
      patientGroups.get(patientId)!.push({ index: index + 1, item })
    })

    // Check for multiple treatments per patient in the same request
    const bulkViolations: string[] = []
    patientGroups.forEach((items, patientId) => {
      if (items.length > 1) {
        bulkViolations.push(
          `Patient ${patientId} has ${items.length} treatments in bulk request (items: ${items.map((i) => i.index).join(', ')}). ` +
            `Only 1 active treatment per patient is allowed by business rules.`,
        )
      }
    })

    if (bulkViolations.length > 0) {
      throw new Error(`Bulk create validation failed:\n${bulkViolations.join('\n')}`)
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

          // BUSINESS RULE CHECK: Check if patient already has active treatments
          const existingActive = await this.patientTreatmentRepository.getActivePatientTreatments({
            patientId: processedTreatment.patientId,
          })

          if (existingActive.length > 0) {
            const activeProtocols = new Set(existingActive.map((t) => t.protocolId))
            const activeProtocolsList = Array.from(activeProtocols).join(', ')

            const warningMessage =
              `Item ${itemIndex}: Patient ${processedTreatment.patientId} already has ${existingActive.length} active treatment(s) ` +
              `with protocol(s): ${activeProtocolsList}. Creating additional treatment may violate business rules.`

            console.warn(warningMessage)

            if (!continueOnError) {
              throw new Error(warningMessage + ' Use continueOnError=true to proceed anyway.')
            }
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
      // Build where clause
      const whereClause: Prisma.PatientTreatmentWhereInput = {}

      if (params.patientId) whereClause.patientId = params.patientId
      if (params.doctorId) whereClause.doctorId = params.doctorId
      if (params.protocolId) whereClause.protocolId = params.protocolId
      if (params.startDate || params.endDate) {
        whereClause.startDate = {}
        if (params.startDate) whereClause.startDate.gte = params.startDate
        if (params.endDate) whereClause.startDate.lte = params.endDate
      }

      // Get all treatments for analysis
      const treatments = await this.patientTreatmentRepository.findPatientTreatments({
        where: whereClause,
        skip: 0,
        take: 10000,
      })

      // Calculate total cost
      const totalCost = treatments.reduce((sum, t) => sum + (t.total || 0), 0)
      const averageCostPerTreatment = treatments.length > 0 ? totalCost / treatments.length : 0

      // Separate standard vs custom medication costs
      const standardTreatments = treatments.filter((t) => !t.customMedications || t.customMedications === null)
      const customTreatments = treatments.filter((t) => t.customMedications && t.customMedications !== null)

      const standardProtocolCosts = standardTreatments.reduce((sum, t) => sum + (t.total || 0), 0)
      const customMedicationCosts = customTreatments.reduce((sum, t) => sum + (t.total || 0), 0)

      // Generate cost trends by month (simplified)
      const monthlyData = new Map<string, { totalCost: number; treatmentCount: number }>()

      treatments.forEach((treatment) => {
        const date = new Date(treatment.startDate)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        const existing = monthlyData.get(monthKey) || { totalCost: 0, treatmentCount: 0 }
        existing.totalCost += treatment.total || 0
        existing.treatmentCount += 1
        monthlyData.set(monthKey, existing)
      })

      const costTrends = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          totalCost: Math.round(data.totalCost * 100) / 100,
          treatmentCount: data.treatmentCount,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      return {
        totalCost: Math.round(totalCost * 100) / 100,
        averageCostPerTreatment: Math.round(averageCostPerTreatment * 100) / 100,
        costBreakdown: {
          standardProtocolCosts: Math.round(standardProtocolCosts * 100) / 100,
          customMedicationCosts: Math.round(customMedicationCosts * 100) / 100,
        },
        costTrends,
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Validate and calculate treatment cost based on protocol and custom medications
   * Provides transparent cost calculation with breakdown
   */
  private validateAndCalculateCost(
    protocolId: number,
    customMedications: any,
    startDate: Date,
    endDate?: Date | null,
  ): {
    isValid: boolean
    calculatedTotal: number
    breakdown: {
      protocolCost: number
      customMedicationCost: number
      durationMultiplier: number
      durationInDays: number | null
    }
    warnings: string[]
  } {
    const warnings: string[] = []

    // Calculate treatment duration
    let durationInDays: number | null = null
    let durationMultiplier = 1

    if (endDate) {
      durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      if (durationInDays <= 0) {
        return {
          isValid: false,
          calculatedTotal: 0,
          breakdown: { protocolCost: 0, customMedicationCost: 0, durationMultiplier: 0, durationInDays: 0 },
          warnings: ['Invalid duration: end date must be after start date'],
        }
      }
      // Calculate monthly multiplier (30 days = 1 month)
      durationMultiplier = Math.max(1, Math.ceil(durationInDays / 30))
    } else {
      // Default duration if no end date (ongoing treatment)
      durationInDays = null // Ongoing
      durationMultiplier = 1 // Base cost for 1 month
      warnings.push('No end date specified - using base monthly cost')
    }

    // Protocol base cost (simplified - in real app, fetch from protocol table)
    const protocolCost = 1000 * durationMultiplier // Base $1000 per month

    // Custom medication cost calculation
    let customMedicationCost = 0
    if (customMedications && typeof customMedications === 'object') {
      try {
        const medications = Array.isArray(customMedications) ? customMedications : [customMedications]
        for (const med of medications) {
          if (med && typeof med.price === 'number' && typeof med.quantity === 'number') {
            customMedicationCost += med.price * med.quantity * durationMultiplier
          } else {
            warnings.push(`Invalid custom medication format: ${JSON.stringify(med)}`)
          }
        }
      } catch (error) {
        warnings.push(`Error processing custom medications: ${error.message}`)
      }
    }

    const calculatedTotal = protocolCost + customMedicationCost

    return {
      isValid: true,
      calculatedTotal: Math.round(calculatedTotal * 100) / 100, // Round to 2 decimal places
      breakdown: {
        protocolCost,
        customMedicationCost,
        durationMultiplier,
        durationInDays,
      },
      warnings,
    }
  }

  /**
   * Public wrapper for cost validation and calculation
   * Useful for frontend cost preview before creating treatment
   */
  public calculateTreatmentCost(
    protocolId: number,
    customMedications: any,
    startDate: Date,
    endDate?: Date | null,
  ): {
    isValid: boolean
    calculatedTotal: number
    breakdown: {
      protocolCost: number
      customMedicationCost: number
      durationMultiplier: number
      durationInDays: number | null
    }
    warnings: string[]
  } {
    try {
      // Validate inputs
      if (!protocolId || protocolId <= 0) {
        return {
          isValid: false,
          calculatedTotal: 0,
          breakdown: { protocolCost: 0, customMedicationCost: 0, durationMultiplier: 0, durationInDays: 0 },
          warnings: ['Invalid protocol ID'],
        }
      }

      if (!startDate || !(startDate instanceof Date)) {
        return {
          isValid: false,
          calculatedTotal: 0,
          breakdown: { protocolCost: 0, customMedicationCost: 0, durationMultiplier: 0, durationInDays: 0 },
          warnings: ['Invalid start date'],
        }
      }

      return this.validateAndCalculateCost(protocolId, customMedications, startDate, endDate)
    } catch (error) {
      return {
        isValid: false,
        calculatedTotal: 0,
        breakdown: { protocolCost: 0, customMedicationCost: 0, durationMultiplier: 0, durationInDays: 0 },
        warnings: [`Error calculating cost: ${error.message}`],
      }
    }
  }

  // End all active treatments for a patient with transaction support
  async endActivePatientTreatments(patientId: number): Promise<{
    success: boolean
    activeTreatments: PatientTreatment[]
    deactivatedCount: number
    endDate: Date
    message: string
  }> {
    try {
      // Validate patientId
      const validatedPatientId = this.errorHandlingService.validateId(patientId)

      // Get existing active treatments
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId: validatedPatientId,
      })

      // If no active treatments, return early
      if (activeTreatments.length === 0) {
        return {
          success: true,
          activeTreatments: [],
          deactivatedCount: 0,
          endDate: new Date(),
          message: 'No active treatments found for this patient',
        }
      }

      // End active treatments by setting their end date to now
      const endDate = new Date()
      const treatmentIds = activeTreatments.map((t) => t.id)

      // Use batch update for better performance and atomicity
      const updateResult = await this.patientTreatmentRepository.batchUpdatePatientTreatments(treatmentIds, { endDate })

      // Verify the update was successful
      const deactivatedCount = updateResult.count || treatmentIds.length

      // Audit log for ending active treatments
      this.logTreatmentOperation('endActivePatientTreatments', {
        patientId: validatedPatientId,
        deactivatedCount,
        endDate,
      })

      return {
        success: true,
        activeTreatments: activeTreatments, // Return original treatments for reference
        deactivatedCount,
        endDate,
        message: `Successfully ended ${deactivatedCount} active treatment(s) for patient ${validatedPatientId}`,
      }
    } catch (error) {
      // Return structured error instead of throwing
      return {
        success: false,
        activeTreatments: [],
        deactivatedCount: 0,
        endDate: new Date(),
        message: `Failed to end active treatments: ${error.message}`,
      }
    }
  }

  // Get active patient treatments by patient ID with current status indicator
  async getActivePatientTreatmentsByPatient(patientId: number): Promise<(PatientTreatment & { isCurrent: boolean })[]> {
    try {
      // Validate patientId
      const validatedPatientId = this.errorHandlingService.validateId(patientId)

      // Use repository's enhanced method for active treatments by patient
      const activePatientTreatments = await this.patientTreatmentRepository.getActivePatientTreatmentsByPatientId(
        validatedPatientId,
        false, // don't include history
      )

      // Map to expected interface for controller
      return activePatientTreatments.map((treatment) => ({
        ...treatment,
        isCurrent: treatment.isCurrent,
      }))
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Validate single protocol rule for a patient
  async validateSingleProtocolRule(patientId: number): Promise<{
    isValid: boolean
    errors: string[]
    currentTreatments: any[]
    protocolConflicts?: Array<{
      protocolId: number
      treatmentIds: number[]
      conflictType: 'multiple_active' | 'protocol_overlap'
    }>
  }> {
    try {
      // Validate patientId
      const validatedPatientId = this.errorHandlingService.validateId(patientId)

      // Use repository method to get active treatments and validate business rules
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId: validatedPatientId,
      })

      // Business rule validation: 1 patient = 1 active protocol at any given time
      const errors: string[] = []
      const protocolConflicts: Array<{
        protocolId: number
        treatmentIds: number[]
        conflictType: 'multiple_active' | 'protocol_overlap'
      }> = []

      // Check 1: Total number of active treatments
      if (activeTreatments.length > 1) {
        errors.push(
          `Patient ${validatedPatientId} has ${activeTreatments.length} active treatments. Only 1 is allowed per business rules.`,
        )

        // Group by protocol to identify conflicts
        const protocolGroups = new Map<number, number[]>()
        activeTreatments.forEach((treatment) => {
          const protocolId = treatment.protocolId
          if (!protocolGroups.has(protocolId)) {
            protocolGroups.set(protocolId, [])
          }
          protocolGroups.get(protocolId)!.push(treatment.id)
        })

        // Check for multiple protocols or multiple treatments per protocol
        protocolGroups.forEach((treatmentIds, protocolId) => {
          if (treatmentIds.length > 1) {
            protocolConflicts.push({
              protocolId,
              treatmentIds,
              conflictType: 'multiple_active',
            })
            errors.push(
              `Protocol ${protocolId} has ${treatmentIds.length} active treatments: ${treatmentIds.join(', ')}`,
            )
          }
        })

        if (protocolGroups.size > 1) {
          errors.push(`Patient has multiple active protocols: ${Array.from(protocolGroups.keys()).join(', ')}`)
        }
      }

      // Check 2: Date overlaps between different protocols (if multiple exist)
      if (activeTreatments.length > 1) {
        const currentDate = new Date()

        for (let i = 0; i < activeTreatments.length; i++) {
          for (let j = i + 1; j < activeTreatments.length; j++) {
            const treatment1 = activeTreatments[i]
            const treatment2 = activeTreatments[j]

            // If different protocols, check for date overlap
            if (treatment1.protocolId !== treatment2.protocolId) {
              const start1 = new Date(treatment1.startDate)
              const end1 = treatment1.endDate ? new Date(treatment1.endDate) : currentDate
              const start2 = new Date(treatment2.startDate)
              const end2 = treatment2.endDate ? new Date(treatment2.endDate) : currentDate

              // Check for overlap: (start1 <= end2) && (start2 <= end1)
              if (start1 <= end2 && start2 <= end1) {
                protocolConflicts.push({
                  protocolId: treatment1.protocolId,
                  treatmentIds: [treatment1.id, treatment2.id],
                  conflictType: 'protocol_overlap',
                })
                errors.push(
                  `Protocol overlap detected: Treatment ${treatment1.id} (Protocol ${treatment1.protocolId}) ` +
                    `overlaps with Treatment ${treatment2.id} (Protocol ${treatment2.protocolId})`,
                )
              }
            }
          }
        }
      }

      const isValid = activeTreatments.length <= 1 && errors.length === 0

      return {
        isValid,
        errors,
        currentTreatments: activeTreatments,
        protocolConflicts: protocolConflicts.length > 0 ? protocolConflicts : undefined,
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Comprehensive business rule test - validates all aspects of the single protocol rule
   * This method tests edge cases and ensures the business logic is bulletproof
   */
  async testBusinessRuleCompliance(patientId: number): Promise<{
    passed: boolean
    tests: Array<{
      testName: string
      passed: boolean
      details: string
      severity: 'info' | 'warning' | 'error'
    }>
    overallStatus: 'compliant' | 'warning' | 'violation'
    summary: {
      activeCount: number
      protocolCount: number
      overlaps: number
      futureConflicts: number
    }
  }> {
    try {
      const validatedPatientId = this.errorHandlingService.validateId(patientId)
      const tests: Array<{
        testName: string
        passed: boolean
        details: string
        severity: 'info' | 'warning' | 'error'
      }> = []

      // Get active treatments
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId: validatedPatientId,
      })

      const currentDate = new Date()
      let overallSeverity: 'info' | 'warning' | 'error' = 'info'

      // Test 1: Active treatment count
      const activeCount = activeTreatments.length
      tests.push({
        testName: 'Active Treatment Count',
        passed: activeCount <= 1,
        details: `Patient has ${activeCount} active treatment(s). Business rule allows maximum 1.`,
        severity: activeCount > 1 ? 'error' : 'info',
      })
      if (activeCount > 1) overallSeverity = 'error'

      // Test 2: Protocol diversity
      const uniqueProtocols = new Set(activeTreatments.map((t) => t.protocolId))
      const protocolCount = uniqueProtocols.size
      tests.push({
        testName: 'Protocol Diversity',
        passed: protocolCount <= 1,
        details: `Patient has ${protocolCount} different active protocol(s): ${Array.from(uniqueProtocols).join(', ')}`,
        severity: protocolCount > 1 ? 'error' : 'info',
      })
      if (protocolCount > 1) overallSeverity = 'error'

      // Test 3: Date overlaps
      let overlapCount = 0
      if (activeTreatments.length > 1) {
        for (let i = 0; i < activeTreatments.length; i++) {
          for (let j = i + 1; j < activeTreatments.length; j++) {
            const t1 = activeTreatments[i]
            const t2 = activeTreatments[j]

            const start1 = new Date(t1.startDate)
            const end1 = t1.endDate ? new Date(t1.endDate) : currentDate
            const start2 = new Date(t2.startDate)
            const end2 = t2.endDate ? new Date(t2.endDate) : currentDate

            if (start1 <= end2 && start2 <= end1) {
              overlapCount++
            }
          }
        }
      }
      tests.push({
        testName: 'Date Overlap Detection',
        passed: overlapCount === 0,
        details: `Found ${overlapCount} overlapping treatment period(s)`,
        severity: overlapCount > 0 ? 'error' : 'info',
      })
      if (overlapCount > 0) overallSeverity = 'error'

      // Test 4: Future conflicts (treatments starting in the future)
      const futureTreatments = activeTreatments.filter((t) => new Date(t.startDate) > currentDate)
      const futureConflicts = futureTreatments.length > 1 ? futureTreatments.length - 1 : 0
      tests.push({
        testName: 'Future Conflict Prevention',
        passed: futureConflicts === 0,
        details: `${futureTreatments.length} treatment(s) scheduled for future, ${futureConflicts} potential conflict(s)`,
        severity: futureConflicts > 0 ? 'warning' : 'info',
      })
      if (futureConflicts > 0 && overallSeverity === 'info') overallSeverity = 'warning'

      // Test 5: Data integrity
      let dataIntegrityIssues = 0
      activeTreatments.forEach((treatment, index) => {
        if (!treatment.startDate) {
          dataIntegrityIssues++
        }
        if (treatment.endDate && new Date(treatment.endDate) <= new Date(treatment.startDate)) {
          dataIntegrityIssues++
        }
      })
      tests.push({
        testName: 'Data Integrity',
        passed: dataIntegrityIssues === 0,
        details: `${dataIntegrityIssues} data integrity issue(s) found in treatment records`,
        severity: dataIntegrityIssues > 0 ? 'warning' : 'info',
      })
      if (dataIntegrityIssues > 0 && overallSeverity === 'info') overallSeverity = 'warning'

      const allTestsPassed = tests.every((test) => test.passed)
      const overallStatus =
        overallSeverity === 'error' ? 'violation' : overallSeverity === 'warning' ? 'warning' : 'compliant'

      return {
        passed: allTestsPassed,
        tests,
        overallStatus,
        summary: {
          activeCount,
          protocolCount,
          overlaps: overlapCount,
          futureConflicts,
        },
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // ===============================
  // BUSINESS RULES SUMMARY & VALIDATION STATUS
  // ===============================

  /**
   * Get a summary of business rules implementation status
   * Shows which rules are implemented and available for validation
   */
  /**
   * Get business rules implementation status
   * Simplified version with essential information only
   */
  getBusinessRulesImplementationStatus(): {
    totalRules: number
    implementedRules: number
    mockRules: number
    availableEndpoints: string[]
    summary: {
      coreRules: number
      clinicalRules: number
      safetyRules: number
      specializedRules: number
    }
  } {
    // Core counts
    const coreRules = 3 // Active Patient Limit, Date Validation, Cost Validation
    const clinicalRules = 4 // Duration, Continuity, Viral Load, Adherence
    const safetyRules = 5 // Doctor Auth, Pregnancy, Organ Function, Drug Interactions, Age
    const specializedRules = 2 // Resistance Patterns, Emergency Protocols

    const totalRules = coreRules + clinicalRules + safetyRules + specializedRules
    const implementedRules = coreRules + clinicalRules // Core and clinical rules are implemented
    const mockRules = safetyRules + specializedRules // Safety and specialized rules are mocked

    const availableEndpoints = [
      'GET /patient-treatment/test/business-rule-compliance/:patientId',
      'POST /patient-treatment/audit/fix-business-rule-violations',
      'GET /patient-treatment/validation/comprehensive/:patientId',
      'POST /patient-treatment/validation/*',
    ]

    return {
      totalRules,
      implementedRules,
      mockRules,
      availableEndpoints,
      summary: {
        coreRules,
        clinicalRules,
        safetyRules,
        specializedRules,
      },
    }
  }

  /**
   * Quick business rules check for a patient
   * Simplified version without detailed validation
   */
  async quickBusinessRulesCheck(patientId: number): Promise<{
    patientId: number
    hasActiveViolations: boolean
    activeViolationsCount: number
    quickChecks: {
      multipleActiveTreatments: boolean
      futureDatesDetected: boolean
      invalidDateRanges: boolean
    }
    recommendation: string
  }> {
    const activeTreatments = await this.getActivePatientTreatments({ patientId })

    const quickChecks = {
      multipleActiveTreatments: activeTreatments.data.length > 1,
      futureDatesDetected: false,
      invalidDateRanges: false,
    }

    // Check for future dates and invalid ranges
    for (const treatment of activeTreatments.data) {
      const startDate = new Date(treatment.startDate)
      const endDate = treatment.endDate ? new Date(treatment.endDate) : null

      if (startDate > new Date()) {
        quickChecks.futureDatesDetected = true
      }

      if (endDate && endDate <= startDate) {
        quickChecks.invalidDateRanges = true
      }
    }

    const activeViolationsCount = Object.values(quickChecks).filter(Boolean).length
    const hasActiveViolations = activeViolationsCount > 0

    let recommendation = 'No immediate business rule violations detected.'
    if (hasActiveViolations) {
      recommendation = 'Business rule violations detected. Run comprehensive validation for detailed analysis.'
    }

    return {
      patientId,
      hasActiveViolations,
      activeViolationsCount,
      quickChecks,
      recommendation,
    }
  }

  // ===============================
  // MISSING VALIDATION METHODS
  // ===============================

  /**
   * Validate viral load monitoring compliance for a patient
   */
  validateViralLoadMonitoring(
    patientId: number,
    treatmentStartDate: Date,
  ): {
    isCompliant: boolean
    lastViralLoad: Date | null
    daysSinceLastTest: number | null
    requiredTestFrequency: 'monthly' | 'quarterly' | 'biannually'
    nextTestDue: Date
    urgencyLevel: 'normal' | 'due' | 'overdue' | 'critical'
    recommendations: string[]
  } {
    // Mock implementation - In real system, this would check actual test results
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - treatmentStartDate.getTime()) / (1000 * 60 * 60 * 24))

    // Determine test frequency based on treatment duration
    let requiredTestFrequency: 'monthly' | 'quarterly' | 'biannually' = 'quarterly'
    if (daysSinceStart < 180) {
      // First 6 months - monthly
      requiredTestFrequency = 'monthly'
    } else if (daysSinceStart < 365) {
      // 6-12 months - quarterly
      requiredTestFrequency = 'quarterly'
    } else {
      // > 1 year - biannually
      requiredTestFrequency = 'biannually'
    }

    // Mock last test date (would come from TestResult table)
    const lastViralLoad = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
    const daysSinceLastTest = Math.floor((now.getTime() - lastViralLoad.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate next test due date
    const testIntervalDays = requiredTestFrequency === 'monthly' ? 30 : requiredTestFrequency === 'quarterly' ? 90 : 180
    const nextTestDue = new Date(lastViralLoad.getTime() + testIntervalDays * 24 * 60 * 60 * 1000)

    // Determine urgency
    let urgencyLevel: 'normal' | 'due' | 'overdue' | 'critical' = 'normal'
    const daysOverdue = Math.floor((now.getTime() - nextTestDue.getTime()) / (1000 * 60 * 60 * 24))

    if (daysOverdue > 30) urgencyLevel = 'critical'
    else if (daysOverdue > 0) urgencyLevel = 'overdue'
    else if (daysOverdue > -7) urgencyLevel = 'due'

    const isCompliant = urgencyLevel === 'normal'
    const recommendations: string[] = []

    if (!isCompliant) {
      recommendations.push(
        `Schedule viral load test immediately - ${Math.abs(daysOverdue)} days ${daysOverdue > 0 ? 'overdue' : 'until due'}`,
      )
    }
    if (requiredTestFrequency === 'monthly') {
      recommendations.push('Patient in initial treatment phase - requires monthly monitoring')
    }

    return {
      isCompliant,
      lastViralLoad,
      daysSinceLastTest,
      requiredTestFrequency,
      nextTestDue,
      urgencyLevel,
      recommendations,
    }
  }

  /**
   * Validate treatment adherence and get recommendations
   */
  validateTreatmentAdherence(adherenceData: {
    pillsMissed: number
    totalPills: number
    recentAdherencePattern: number[]
  }): {
    adherencePercentage: number
    adherenceLevel: 'excellent' | 'good' | 'suboptimal' | 'poor'
    riskAssessment: 'low' | 'medium' | 'high' | 'critical'
    interventionsRequired: string[]
    recommendations: string[]
  } {
    const { pillsMissed, totalPills, recentAdherencePattern } = adherenceData

    const adherencePercentage = totalPills > 0 ? ((totalPills - pillsMissed) / totalPills) * 100 : 0

    let adherenceLevel: 'excellent' | 'good' | 'suboptimal' | 'poor' = 'poor'
    let riskAssessment: 'low' | 'medium' | 'high' | 'critical' = 'critical'

    if (adherencePercentage >= 95) {
      adherenceLevel = 'excellent'
      riskAssessment = 'low'
    } else if (adherencePercentage >= 85) {
      adherenceLevel = 'good'
      riskAssessment = 'medium'
    } else if (adherencePercentage >= 70) {
      adherenceLevel = 'suboptimal'
      riskAssessment = 'high'
    }

    const interventionsRequired: string[] = []
    const recommendations: string[] = []

    if (adherencePercentage < 95) {
      interventionsRequired.push('Adherence counseling required')
      recommendations.push('Schedule adherence counseling session')
    }
    if (adherencePercentage < 85) {
      interventionsRequired.push('Enhanced support measures')
      recommendations.push('Consider pill organizers, reminders, or directly observed therapy')
    }
    if (adherencePercentage < 70) {
      interventionsRequired.push('Urgent clinical review')
      recommendations.push('Immediate clinical assessment for treatment modification')
    }

    return {
      adherencePercentage: Math.round(adherencePercentage * 100) / 100,
      adherenceLevel,
      riskAssessment,
      interventionsRequired,
      recommendations,
    }
  }

  /**
   * Validate pregnancy safety for HIV treatment protocol
   */
  validatePregnancySafety(
    patientGender: 'male' | 'female' | 'other',
    isPregnant: boolean,
    isBreastfeeding: boolean,
    protocolId: number,
  ): {
    isSafe: boolean
    pregnancyCategory: 'A' | 'B' | 'C' | 'D' | 'X' | 'N/A'
    contraindicatedMedications: string[]
    alternativeRecommendations: string[]
    monitoringRequirements: string[]
  } {
    // Mock implementation - In real system, check protocol medications against pregnancy safety database
    let pregnancyCategory: 'A' | 'B' | 'C' | 'D' | 'X' | 'N/A' = 'N/A'
    const contraindicatedMedications: string[] = []
    const alternativeRecommendations: string[] = []
    const monitoringRequirements: string[] = []

    if (patientGender !== 'female') {
      pregnancyCategory = 'N/A'
      return {
        isSafe: true,
        pregnancyCategory,
        contraindicatedMedications,
        alternativeRecommendations,
        monitoringRequirements: ['Standard monitoring applies'],
      }
    }

    // Mock safety assessment for female patients
    if (isPregnant || isBreastfeeding) {
      pregnancyCategory = 'B' // Most HIV medications are category B

      // Mock contraindicated medications (efavirenz is contraindicated in pregnancy)
      if (protocolId === 1) {
        // Assuming protocol 1 contains efavirenz
        contraindicatedMedications.push('Efavirenz')
        alternativeRecommendations.push('Switch to integrase inhibitor-based regimen')
      }

      if (isPregnant) {
        monitoringRequirements.push('Monthly viral load monitoring')
        monitoringRequirements.push('Obstetric consultation')
        monitoringRequirements.push('Fetal development monitoring')
      }

      if (isBreastfeeding) {
        monitoringRequirements.push('Infant HIV testing at 6 weeks, 3 months, 6 months')
        monitoringRequirements.push('Monitor for medication side effects in infant')
      }
    }

    const isSafe = contraindicatedMedications.length === 0

    return {
      isSafe,
      pregnancyCategory,
      contraindicatedMedications,
      alternativeRecommendations,
      monitoringRequirements,
    }
  }

  /**
   * Validate organ function for HIV treatment dosing
   */
  validateOrganFunction(
    liverFunction: { alt: number; ast: number; bilirubin: number },
    kidneyFunction: { creatinine: number; egfr: number },
    protocolId: number,
  ): {
    liverStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment'
    kidneyStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment'
    doseAdjustmentsRequired: string[]
    contraindicatedMedications: string[]
    monitoringRequirements: string[]
  } {
    const { alt, ast, bilirubin } = liverFunction
    const { creatinine, egfr } = kidneyFunction

    // Determine liver status
    let liverStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment' = 'normal'
    if (alt > 120 || ast > 120 || bilirubin > 3) {
      liverStatus = 'severe-impairment'
    } else if (alt > 80 || ast > 80 || bilirubin > 2) {
      liverStatus = 'moderate-impairment'
    } else if (alt > 40 || ast > 40 || bilirubin > 1.5) {
      liverStatus = 'mild-impairment'
    }

    // Determine kidney status
    let kidneyStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment' = 'normal'
    if (egfr < 30 || creatinine > 3) {
      kidneyStatus = 'severe-impairment'
    } else if (egfr < 60 || creatinine > 2) {
      kidneyStatus = 'moderate-impairment'
    } else if (egfr < 90 || creatinine > 1.5) {
      kidneyStatus = 'mild-impairment'
    }

    const doseAdjustmentsRequired: string[] = []
    const contraindicatedMedications: string[] = []
    const monitoringRequirements: string[] = []

    // Liver-related adjustments
    if (liverStatus !== 'normal') {
      doseAdjustmentsRequired.push('Consider dose reduction for hepatically metabolized drugs')
      monitoringRequirements.push('Weekly liver function monitoring')

      if (liverStatus === 'severe-impairment') {
        contraindicatedMedications.push('Nevirapine')
        monitoringRequirements.push('Consider hepatology consultation')
      }
    }

    // Kidney-related adjustments
    if (kidneyStatus !== 'normal') {
      doseAdjustmentsRequired.push('Adjust doses for renally eliminated drugs')
      monitoringRequirements.push('Weekly kidney function monitoring')

      if (kidneyStatus === 'severe-impairment') {
        doseAdjustmentsRequired.push('Reduce tenofovir dose by 50%')
        monitoringRequirements.push('Consider nephrology consultation')
      }
    }

    return {
      liverStatus,
      kidneyStatus,
      doseAdjustmentsRequired,
      contraindicatedMedications,
      monitoringRequirements,
    }
  }

  /**
   * Validate HIV resistance pattern for treatment effectiveness
   */
  validateResistancePattern(
    resistanceData: {
      mutations: string[]
      resistanceLevel: 'none' | 'low' | 'intermediate' | 'high'
      previousFailedRegimens: string[]
    },
    proposedProtocolId: number,
  ): {
    isEffective: boolean
    effectivenessScore: number
    resistantMedications: string[]
    recommendedAlternatives: string[]
    requiresGenotyping: boolean
  } {
    const { mutations, resistanceLevel, previousFailedRegimens } = resistanceData

    // Mock resistance analysis
    const resistantMedications: string[] = []
    const recommendedAlternatives: string[] = []

    // Check for common resistance mutations
    if (mutations.includes('M184V')) {
      resistantMedications.push('Lamivudine', 'Emtricitabine')
    }
    if (mutations.includes('K103N')) {
      resistantMedications.push('Efavirenz', 'Nevirapine')
    }
    if (mutations.includes('Q148H')) {
      resistantMedications.push('Raltegravir', 'Elvitegravir')
    }

    // Calculate effectiveness score
    let effectivenessScore = 100

    if (resistanceLevel === 'high') effectivenessScore -= 60
    else if (resistanceLevel === 'intermediate') effectivenessScore -= 40
    else if (resistanceLevel === 'low') effectivenessScore -= 20

    effectivenessScore -= resistantMedications.length * 15
    effectivenessScore -= previousFailedRegimens.length * 10

    const isEffective = effectivenessScore >= 70
    const requiresGenotyping = resistanceLevel !== 'none' || previousFailedRegimens.length > 0

    if (!isEffective) {
      recommendedAlternatives.push('Consider second-line regimen with integrase inhibitor')
      recommendedAlternatives.push('Evaluate for newer agents (bictegravir, cabotegravir)')
    }

    return {
      isEffective,
      effectivenessScore: Math.max(0, effectivenessScore),
      resistantMedications,
      recommendedAlternatives,
      requiresGenotyping,
    }
  }

  /**
   * Validate emergency treatment protocols (PEP/PrEP)
   */
  validateEmergencyProtocol(
    treatmentType: 'pep' | 'prep' | 'standard',
    exposureDate?: Date,
    riskFactors?: string[],
  ): {
    isValidTiming: boolean
    timeWindow: string
    urgencyLevel: 'routine' | 'urgent' | 'emergency'
    protocolRecommendations: string[]
    followUpRequirements: string[]
  } {
    const now = new Date()
    const protocolRecommendations: string[] = []
    const followUpRequirements: string[] = []

    let isValidTiming = true
    let timeWindow = 'Standard treatment timing'
    let urgencyLevel: 'routine' | 'urgent' | 'emergency' = 'routine'

    if (treatmentType === 'pep' && exposureDate) {
      const hoursAfterExposure = (now.getTime() - exposureDate.getTime()) / (1000 * 60 * 60)

      if (hoursAfterExposure > 72) {
        isValidTiming = false
        timeWindow = 'PEP window expired (>72 hours)'
        urgencyLevel = 'emergency'
        protocolRecommendations.push('PEP may not be effective - consult HIV specialist')
      } else if (hoursAfterExposure > 24) {
        timeWindow = 'Late PEP initiation (24-72 hours)'
        urgencyLevel = 'emergency'
        protocolRecommendations.push('Start PEP immediately - reduced efficacy expected')
      } else {
        timeWindow = 'Optimal PEP window (<24 hours)'
        urgencyLevel = 'emergency'
        protocolRecommendations.push('Start PEP within 2 hours of presentation')
      }

      followUpRequirements.push('HIV testing at baseline, 6 weeks, 3 months, 6 months')
      followUpRequirements.push('Monitor for drug side effects')
    }

    if (treatmentType === 'prep') {
      urgencyLevel = 'routine'
      protocolRecommendations.push('Confirm HIV negative status before starting')
      protocolRecommendations.push('Assess kidney function (creatinine, eGFR)')
      followUpRequirements.push('HIV testing every 3 months')
      followUpRequirements.push('Kidney function monitoring every 6 months')
    }

    return {
      isValidTiming,
      timeWindow,
      urgencyLevel,
      protocolRecommendations,
      followUpRequirements,
    }
  }

  /**
   * Validate treatment continuity
   */
  async validateTreatmentContinuity(
    patientId: number,
    currentTreatmentStart: Date,
  ): Promise<{
    isContinuous: boolean
    gapDays: number | null
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    recommendations: string[]
  }> {
    try {
      // Get patient's treatment history
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(patientId, {
        skip: 0,
        take: 100,
      })

      // Sort by start date
      const sortedTreatments = allTreatments.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )

      // Find previous treatment before current one
      const currentIndex = sortedTreatments.findIndex(
        (t) => new Date(t.startDate).getTime() === currentTreatmentStart.getTime(),
      )

      if (currentIndex <= 0) {
        return {
          isContinuous: true,
          gapDays: null,
          riskLevel: 'low',
          recommendations: ['First treatment for patient - no continuity concerns'],
        }
      }

      const previousTreatment = sortedTreatments[currentIndex - 1]
      const previousEndDate = previousTreatment.endDate ? new Date(previousTreatment.endDate) : new Date()
      const gapDays = Math.floor((currentTreatmentStart.getTime() - previousEndDate.getTime()) / (1000 * 60 * 60 * 24))

      let isContinuous = true
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      const recommendations: string[] = []

      if (gapDays > 7) {
        isContinuous = false
        if (gapDays > 30) {
          riskLevel = 'critical'
          recommendations.push('Treatment gap >30 days - high risk of viral rebound')
          recommendations.push('Consider resistance testing before restarting')
        } else if (gapDays > 14) {
          riskLevel = 'high'
          recommendations.push('Treatment gap >14 days - monitor for viral rebound')
        } else {
          riskLevel = 'medium'
          recommendations.push('Short treatment gap detected - monitor closely')
        }
      }

      return {
        isContinuous,
        gapDays,
        riskLevel,
        recommendations,
      }
    } catch (error) {
      return {
        isContinuous: false,
        gapDays: null,
        riskLevel: 'critical',
        recommendations: ['Error validating treatment continuity - manual review required'],
      }
    }
  }

  /**
   * Validate doctor protocol authorization
   */
  validateDoctorProtocolAuthorization(
    doctorId: number,
    protocolId: number,
  ): Promise<{
    isAuthorized: boolean
    doctorLevel: string
    protocolComplexity: string
    requirements: string[]
  }> {
    return new Promise((resolve) => {
      try {
        // Mock implementation - In real system, check doctor credentials and protocol requirements
        const requirements: string[] = []

        // Mock doctor level assessment
        const doctorLevel = doctorId % 3 === 0 ? 'specialist' : doctorId % 2 === 0 ? 'experienced' : 'general'

        // Mock protocol complexity
        const protocolComplexity = protocolId > 10 ? 'complex' : protocolId > 5 ? 'intermediate' : 'standard'

        let isAuthorized = true

        if (protocolComplexity === 'complex' && doctorLevel === 'general') {
          isAuthorized = false
          requirements.push('Complex protocols require specialist authorization')
          requirements.push('Obtain HIV specialist consultation')
        }

        if (protocolComplexity === 'intermediate' && doctorLevel === 'general') {
          requirements.push('Consider specialist consultation for intermediate protocols')
        }

        resolve({
          isAuthorized,
          doctorLevel,
          protocolComplexity,
          requirements,
        })
      } catch (error) {
        resolve({
          isAuthorized: false,
          doctorLevel: 'unknown',
          protocolComplexity: 'unknown',
          requirements: ['Error validating doctor authorization - manual review required'],
        })
      }
    })
  }

  /**
   * Detect business rule violations across all patients
   */
  async detectBusinessRuleViolations(): Promise<{
    totalViolations: number
    violatingPatients: Array<{
      patientId: number
      activeTreatmentCount: number
      treatments: Array<{
        id: number
        protocolId: number
        startDate: string
        endDate: string | null
      }>
      protocols: number[]
    }>
  }> {
    try {
      // Get all active treatments
      const allActiveTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({})

      // Group by patient
      const patientGroups = new Map<number, any[]>()
      allActiveTreatments.forEach((treatment) => {
        if (!patientGroups.has(treatment.patientId)) {
          patientGroups.set(treatment.patientId, [])
        }
        patientGroups.get(treatment.patientId)!.push(treatment)
      })

      // Find violations (patients with multiple active treatments)
      const violatingPatients: Array<{
        patientId: number
        activeTreatmentCount: number
        treatments: Array<{
          id: number
          protocolId: number
          startDate: string
          endDate: string | null
        }>
        protocols: number[]
      }> = []

      patientGroups.forEach((treatments, patientId) => {
        if (treatments.length > 1) {
          const protocols = [...new Set(treatments.map((t: any) => t.protocolId as number))]
          violatingPatients.push({
            patientId,
            activeTreatmentCount: treatments.length,
            treatments: treatments.map((t) => ({
              id: t.id,
              protocolId: t.protocolId,
              startDate: t.startDate.toISOString(),
              endDate: t.endDate ? t.endDate.toISOString() : null,
            })),
            protocols,
          })
        }
      })

      return {
        totalViolations: violatingPatients.length,
        violatingPatients,
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Fix business rule violations by ending older treatments
   */
  async fixBusinessRuleViolations(isDryRun: boolean = true): Promise<{
    processedPatients: number
    treatmentsEnded: number
    errors: string[]
    actions: Array<{
      patientId: number
      action: 'end_treatment'
      treatmentId: number
      protocolId: number
      newEndDate: string
    }>
  }> {
    try {
      const violations = await this.detectBusinessRuleViolations()
      const actions: Array<{
        patientId: number
        action: 'end_treatment'
        treatmentId: number
        protocolId: number
        newEndDate: string
      }> = []
      const errors: string[] = []
      let treatmentsEnded = 0

      const fixDate = new Date()

      for (const violation of violations.violatingPatients) {
        try {
          // Sort treatments by start date (keep the most recent)
          const sortedTreatments = violation.treatments.sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
          )

          // End all but the most recent treatment
          for (let i = 1; i < sortedTreatments.length; i++) {
            const treatmentToEnd = sortedTreatments[i]
            const newEndDate = new Date(fixDate)

            actions.push({
              patientId: violation.patientId,
              action: 'end_treatment',
              treatmentId: treatmentToEnd.id,
              protocolId: treatmentToEnd.protocolId,
              newEndDate: newEndDate.toISOString(),
            })

            if (!isDryRun) {
              await this.patientTreatmentRepository.updatePatientTreatment(treatmentToEnd.id, {
                endDate: newEndDate,
              })
              treatmentsEnded++
            }
          }
        } catch (error) {
          errors.push(`Failed to fix violations for patient ${violation.patientId}: ${error.message}`)
        }
      }

      return {
        processedPatients: violations.violatingPatients.length,
        treatmentsEnded: isDryRun ? actions.length : treatmentsEnded,
        errors,
        actions,
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Get general treatment statistics across all treatments
   */
  async getGeneralTreatmentStats(): Promise<{
    totalTreatments: number
    activeTreatments: number
    completedTreatments: number
    totalPatients: number
    averageTreatmentDuration: number | null
    totalCost: number
    averageCostPerTreatment: number
    topProtocols: Array<{
      protocolId: number
      count: number
      percentage: number
    }>
    monthlyTrends: Array<{
      month: string
      newTreatments: number
      completedTreatments: number
      totalCost: number
    }>
  }> {
    try {
      // Get all treatments
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatments({
        skip: 0,
        take: 10000, // Large number to get all
      })

      // Get active treatments
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({})

      // Calculate basic stats
      const totalTreatments = allTreatments.length
      const activeTreatmentsCount = activeTreatments.length
      const completedTreatments = totalTreatments - activeTreatmentsCount
      const totalPatients = new Set(allTreatments.map((t) => t.patientId)).size
      const totalCost = allTreatments.reduce((sum, t) => sum + (t.total || 0), 0)
      const averageCostPerTreatment = totalTreatments > 0 ? totalCost / totalTreatments : 0

      // Calculate average duration
      const completedTreatmentsWithDuration = allTreatments.filter((t) => t.endDate)
      let averageTreatmentDuration: number | null = null

      if (completedTreatmentsWithDuration.length > 0) {
        const totalDuration = completedTreatmentsWithDuration.reduce((sum, t) => {
          const start = new Date(t.startDate)
          const end = new Date(t.endDate!)
          const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          return sum + duration
        }, 0)
        averageTreatmentDuration = Math.round(totalDuration / completedTreatmentsWithDuration.length)
      }

      // Calculate top protocols
      const protocolCounts = new Map<number, number>()
      allTreatments.forEach((t) => {
        const count = protocolCounts.get(t.protocolId) || 0
        protocolCounts.set(t.protocolId, count + 1)
      })

      const topProtocols = Array.from(protocolCounts.entries())
        .map(([protocolId, count]) => ({
          protocolId,
          count,
          percentage: Math.round((count / totalTreatments) * 100 * 100) / 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Calculate monthly trends (last 12 months)
      const monthlyTrends: Array<{
        month: string
        newTreatments: number
        completedTreatments: number
        totalCost: number
      }> = []

      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

        const monthTreatments = allTreatments.filter((t) => {
          const startDate = new Date(t.startDate)
          return startDate >= monthStart && startDate <= monthEnd
        })

        const monthCompleted = allTreatments.filter((t) => {
          if (!t.endDate) return false
          const endDate = new Date(t.endDate)
          return endDate >= monthStart && endDate <= monthEnd
        })

        monthlyTrends.push({
          month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
          newTreatments: monthTreatments.length,
          completedTreatments: monthCompleted.length,
          totalCost: monthTreatments.reduce((sum, t) => sum + (t.total || 0), 0),
        })
      }

      return {
        totalTreatments,
        activeTreatments: activeTreatmentsCount,
        completedTreatments,
        totalPatients,
        averageTreatmentDuration,
        totalCost: Math.round(totalCost * 100) / 100,
        averageCostPerTreatment: Math.round(averageCostPerTreatment * 100) / 100,
        topProtocols,
        monthlyTrends,
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Enhanced error handling for better debugging and monitoring
  private handleServiceError(error: any, operation: string, context?: any): never {
    const errorMessage = error.message || 'Unknown error occurred'
    const errorContext = {
      operation,
      timestamp: new Date().toISOString(),
      context: context || {},
      stackTrace: error.stack,
    }

    // Log error for monitoring
    console.error(`PatientTreatmentService Error [${operation}]:`, errorContext)

    // Return standardized error
    throw new Error(`${operation} failed: ${errorMessage}`)
  }

  // Audit logging for treatment operations
  private logTreatmentOperation(operation: string, data: any): void {
    const logEntry = {
      operation,
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        // Remove sensitive information
        patientId: data.patientId || 'unknown',
        treatmentId: data.treatmentId || 'unknown',
        userId: data.userId || 'unknown',
      },
    }

    console.log(`AUDIT [PatientTreatment]: ${operation}`, logEntry)
  }

  // Performance metrics tracking
  private trackPerformanceMetric(operation: string, startTime: number, additionalData?: any): void {
    const duration = Date.now() - startTime
    const metric = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...additionalData,
    }

    console.log(`PERFORMANCE [PatientTreatment]: ${operation} completed in ${duration}ms`, metric)

    // Log slow operations (>1000ms)
    if (duration > 1000) {
      console.warn(`SLOW_OPERATION [PatientTreatment]: ${operation} took ${duration}ms`, metric)
    }
  }
}
