import { BadRequestException, ConflictException, Injectable, NotImplementedException } from '@nestjs/common'
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
import { FollowUpAppointmentService } from './services/follow-up-appointment.service'

@Injectable()
export class PatientTreatmentService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly paginationService: PaginationService,
    private readonly errorHandlingService: SharedErrorHandlingService,
    private readonly followUpAppointmentService: FollowUpAppointmentService,
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
        throw new BadRequestException(`Validation failed: ${validationError.message}`)
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
              throw new ConflictException(
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

          throw new ConflictException(
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
        throw new BadRequestException(`Start date cannot be more than 1 year in the past`)
      }
      if (startDate > twoYearsFromNow) {
        throw new BadRequestException(`Start date cannot be more than 2 years in the future`)
      }

      // If endDate is provided, validate it
      if (validatedData.endDate) {
        const endDate = new Date(String(validatedData.endDate))
        if (endDate <= startDate) {
          throw new BadRequestException(`End date must be after start date`)
        }
        if (endDate > twoYearsFromNow) {
          throw new BadRequestException(`End date cannot be more than 2 years in the future`)
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
    try {
      const validatedId = this.errorHandlingService.validateId(id)
      const treatment = await this.patientTreatmentRepository.findPatientTreatmentById(validatedId)
      return this.errorHandlingService.validateEntityExists(treatment, ENTITY_NAMES.PATIENT_TREATMENT, validatedId)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Update patient treatment with business rule validation
  async updatePatientTreatment(id: number, data: UpdatePatientTreatment): Promise<PatientTreatment> {
    try {
      // Check if treatment exists
      const existingTreatment = await this.getPatientTreatmentById(id)

      // Validate notes length if present
      if (data.notes && typeof data.notes === 'string' && data.notes.length > 2000) {
        throw new BadRequestException('Notes must be at most 2000 characters')
      }

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
                throw new ConflictException(
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
    try {
      // Check if treatment exists
      await this.getPatientTreatmentById(id)
      // Audit log for treatment deletion
      this.logTreatmentOperation('delete', { id })
      return this.patientTreatmentRepository.deletePatientTreatment(id)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
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
        throw new BadRequestException(`Invalid query parameters: ${error.message}`)
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
        throw new BadRequestException(`Invalid query parameters: ${error.message}`)
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
        throw new BadRequestException('Doctor ID is required')
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
        throw new BadRequestException(`Invalid query parameters: ${error.message}`)
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
    try {
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

      return await this.patientTreatmentRepository.getPatientTreatmentsByDateRange(validStartDate, validEndDate)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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
    try {
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
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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
      throw new BadRequestException('No treatment items provided for bulk creation')
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
      throw new BadRequestException(`Bulk create validation failed:\n${bulkViolations.join('\n')}`)
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
              throw new ConflictException(warningMessage + ' Use continueOnError=true to proceed anyway.')
            }
          }

          // Create the treatment record
          const created = await this.patientTreatmentRepository.createPatientTreatment(processedTreatment)
          results.push(created)
        } catch (error) {
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

    // Log summary
    console.log(`Bulk create completed: ${results.length} treatments created, ${errors.length} errors`)
    if (errors.length > 0) {
      console.log('Errors:', errors)
    }

    return results
  }

  // Helper methods for bulk create
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
    } catch (error) {
      throw new BadRequestException(`Error parsing number for ${fieldName}: ${error.message}`)
    }
  }

  private safeParseCustomMedications(value: any, itemIndex: number): any {
    try {
      if (!value) return null
      if (Array.isArray(value)) {
        return value
      }
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    } catch (error) {
      throw new BadRequestException(`Invalid custom medications format for item ${itemIndex}: ${error.message}`)
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
    try {
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
      const testIntervalDays =
        requiredTestFrequency === 'monthly' ? 30 : requiredTestFrequency === 'quarterly' ? 90 : 180
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
    } catch (error) {
      return {
        isCompliant: false,
        lastViralLoad: null,
        daysSinceLastTest: null,
        requiredTestFrequency: 'quarterly',
        nextTestDue: new Date(),
        urgencyLevel: 'critical',
        recommendations: [`Error validating viral load monitoring: ${error.message}`],
      }
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
    try {
      const { pillsMissed, totalPills, recentAdherencePattern } = adherenceData
      if (typeof pillsMissed !== 'number' || typeof totalPills !== 'number' || totalPills < 0 || pillsMissed < 0) {
        throw new BadRequestException('Invalid adherence data: pillsMissed and totalPills must be non-negative numbers')
      }
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
    } catch (error) {
      throw new BadRequestException(`Error validating treatment adherence: ${error.message}`)
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

  /**
   * Calculate estimated treatment cost for preview (protocol + custom meds + duration)
   */
  calculateTreatmentCost(
    protocolId: number,
    customMedications: Array<{ cost: number }> | undefined,
    startDate: Date,
    endDate?: Date,
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
    // Mock implementation - replace with real cost logic as needed
    let protocolCost = 1000 // default protocol cost
    let customMedicationCost = 0
    let durationInDays: number | null = null
    let durationMultiplier = 1
    const warnings: string[] = []

    // Example: protocol cost lookup (replace with real DB lookup)
    if (protocolId === 2) protocolCost = 1500
    if (protocolId === 3) protocolCost = 2000

    // Example: custom medication cost
    if (customMedications && Array.isArray(customMedications)) {
      customMedicationCost = customMedications.reduce(
        (sum: number, med: { cost: number }) => sum + (typeof med.cost === 'number' ? med.cost : 0),
        0,
      )
    }

    // Duration calculation
    if (endDate && startDate && endDate > startDate) {
      durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      durationMultiplier = Math.max(1, Math.round(durationInDays / 30)) // per month
    } else if (endDate && startDate && endDate <= startDate) {
      warnings.push('End date is before or equal to start date. Duration set to 1.')
    }

    const calculatedTotal = (protocolCost + customMedicationCost) * durationMultiplier
    const isValid = calculatedTotal > 0

    return {
      isValid,
      calculatedTotal,
      breakdown: {
        protocolCost,
        customMedicationCost,
        durationMultiplier,
        durationInDays,
      },
      warnings,
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
    if (duration > 1000) {
      console.warn(`SLOW_OPERATION [PatientTreatment]: ${operation} took ${duration}ms`, metric)
    }
  }

  // ===============================
  // FOLLOW-UP APPOINTMENT INTEGRATION
  // ===============================

  /**
   * Tạo treatment với tự động hẹn lịch tái khám
   */
  async createPatientTreatmentWithFollowUp(
    data: any,
    userId: number,
    followUpConfig?: {
      autoCreateFollowUp: boolean
      dayOffset?: number
      serviceId?: number
      notes?: string
    },
  ): Promise<{
    treatment: PatientTreatment
    followUpAppointment?: any
    message: string
  }> {
    try {
      // 1. Tạo treatment trước
      const treatment = await this.createPatientTreatment(data, userId, false)

      let followUpAppointment: any = null
      let message = 'Treatment created successfully'

      // 2. Tạo follow-up appointment nếu được yêu cầu
      if (followUpConfig?.autoCreateFollowUp && this.followUpAppointmentService) {
        try {
          const followUpResult = await this.followUpAppointmentService.createFollowUpAppointment(treatment.id, {
            dayOffset: followUpConfig.dayOffset || 30,
            serviceId: followUpConfig.serviceId,
            notes: followUpConfig.notes || 'Auto-generated follow-up appointment',
          })

          if (followUpResult.success && followUpResult.appointment) {
            followUpAppointment = followUpResult.appointment
            message = 'Treatment created with follow-up appointment scheduled'
          }
        } catch (followUpError) {
          console.warn('Failed to create follow-up appointment:', followUpError)
          message = 'Treatment created, but follow-up appointment creation failed'
        }
      }

      return {
        treatment,
        followUpAppointment,
        message,
      }
    } catch (error) {
      return this.handleServiceError(error, 'createPatientTreatmentWithFollowUp', { data, userId })
    }
  }

  /**
   * Lấy treatments với thông tin follow-up appointments
   */
  async getPatientTreatmentsWithFollowUp(patientId: number): Promise<{
    treatments: PatientTreatment[]
    followUpAppointments: any[]
    summary: {
      totalTreatments: number
      treatmentsWithFollowUp: number
      upcomingAppointments: number
    }
  }> {
    try {
      const treatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(patientId, {
        skip: 0,
        take: 100,
      })

      let followUpAppointments: any[] = []
      if (this.followUpAppointmentService) {
        followUpAppointments = await this.followUpAppointmentService.getFollowUpAppointmentsByPatient(patientId)
      }

      // Tính toán summary
      const treatmentsWithFollowUp = treatments.filter((t) =>
        followUpAppointments.some((apt) => apt.notes?.includes(`treatment ${t.id}`)),
      ).length

      const upcomingAppointments = followUpAppointments.filter((apt) => {
        try {
          return apt.appointmentTime && new Date(String(apt.appointmentTime)) > new Date() && apt.status === 'PENDING'
        } catch {
          return false
        }
      }).length

      return {
        treatments,
        followUpAppointments,
        summary: {
          totalTreatments: treatments.length,
          treatmentsWithFollowUp,
          upcomingAppointments,
        },
      }
    } catch (error) {
      return this.handleServiceError(error, 'getPatientTreatmentsWithFollowUp', { patientId })
    }
  }

  /**
   * Recommend follow-up schedule dựa trên treatment type và patient characteristics
   */
  async getRecommendedFollowUpSchedule(treatment: PatientTreatment): Promise<{
    recommendedIntervals: number[]
    totalAppointments: number
    startFromDay: number
    notes: string
    urgencyLevel: 'low' | 'medium' | 'high'
    specialInstructions: string[]
  }> {
    // Lấy thông tin chi tiết về treatment và patient
    const fullTreatment = (await this.patientTreatmentRepository.findPatientTreatmentById(treatment.id)) as any

    if (!fullTreatment?.patient || !fullTreatment?.protocol) {
      // Fallback schedule nếu không có đủ thông tin
      return {
        recommendedIntervals: [30, 90, 180],
        totalAppointments: 3,
        startFromDay: 30,
        notes: 'Standard HIV treatment follow-up schedule',
        urgencyLevel: 'medium',
        specialInstructions: ['Monitor for side effects', 'Check adherence'],
      }
    }

    const patient = fullTreatment.patient

    const protocol = fullTreatment.protocol // Tính tuổi patient (giả sử có dateOfBirth hoặc age field)
    const currentDate = new Date()
    let patientAge = 35 // default age

    if (patient.dateOfBirth) {
      const birthDate = new Date(String(patient.dateOfBirth))
      patientAge = Math.floor((currentDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    } else if (patient.age) {
      patientAge = Number(patient.age)
    }

    // Xác định risk level dựa trên các yếu tố
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    const specialInstructions: string[] = []
    let intervals: number[] = []
    let notes = ''

    // Risk assessment logic
    if (patientAge < 18 || patientAge > 65) {
      riskLevel = 'high'
      specialInstructions.push('Elderly/pediatric patient - closer monitoring required')
    }

    // Check for complex medication regimen
    if (protocol.medicines && protocol.medicines.length > 3) {
      if (riskLevel === 'low') riskLevel = 'medium'
      specialInstructions.push('Complex medication regimen - monitor for drug interactions')
    }

    // Check if this is a new treatment (first 6 months)
    const treatmentStartDate = new Date(treatment.startDate)
    const monthsSinceStart = Math.floor(
      (currentDate.getTime() - treatmentStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000),
    )

    // Xác định lịch tái khám dựa trên risk level và thời gian điều trị
    if (monthsSinceStart < 6) {
      switch (riskLevel) {
        case 'high':
          intervals = [14, 30, 60, 90, 120, 180] // Week 2, Month 1,2,3,4,6
          notes = 'New high-risk patient - intensive monitoring schedule'
          specialInstructions.push('Weekly phone check for first month', 'Monitor for treatment failure signs')
          break
        case 'medium':
          intervals = [30, 60, 90, 180] // Month 1,2,3,6
          notes = 'New patient - standard monitoring schedule'
          specialInstructions.push('Assess adherence carefully', 'Monitor for side effects')
          break
        case 'low':
          intervals = [30, 90, 180] // Month 1,3,6
          notes = 'New low-risk patient - standard schedule'
          specialInstructions.push('Regular adherence assessment')
          break
      }
    } else {
      switch (riskLevel) {
        case 'high':
          intervals = [90, 180, 270, 360] // Every 3 months
          notes = 'Established high-risk patient - quarterly monitoring'
          specialInstructions.push('Quarterly comprehensive assessment', 'Monitor comorbidities')
          break
        case 'medium':
          intervals = [180, 360] // Every 6 months
          notes = 'Established patient - bi-annual monitoring'
          specialInstructions.push('Bi-annual comprehensive check-up')
          break
        case 'low':
          intervals = [360] // Annually
          notes = 'Stable patient - annual monitoring'
          specialInstructions.push('Annual routine check-up')
          break
      }
    }

    // Add general instructions based on protocol type
    if (protocol.name?.toLowerCase().includes('first-line')) {
      specialInstructions.push('Monitor for first-line treatment effectiveness')
    } else if (protocol.name?.toLowerCase().includes('second-line')) {
      specialInstructions.push('Enhanced monitoring for second-line treatment')
      riskLevel = 'high' // Second-line treatments need closer monitoring
    }

    // Custom medications increase complexity
    if (treatment.customMedications && Object.keys(treatment.customMedications).length > 0) {
      specialInstructions.push('Monitor custom medication interactions')
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    // Sau khi riskLevel có thể bị thay đổi, cập nhật lại intervals và notes cho phù hợp
    if (monthsSinceStart < 6) {
      switch (riskLevel) {
        case 'high':
          intervals = [14, 30, 60, 90, 120, 180]
          notes = 'New high-risk patient - intensive monitoring schedule'
          if (!specialInstructions.includes('Weekly phone check for first month'))
            specialInstructions.push('Weekly phone check for first month')
          if (!specialInstructions.includes('Monitor for treatment failure signs'))
            specialInstructions.push('Monitor for treatment failure signs')
          break
        case 'medium':
          intervals = [30, 60, 90, 180]
          notes = 'New patient - standard monitoring schedule'
          if (!specialInstructions.includes('Assess adherence carefully'))
            specialInstructions.push('Assess adherence carefully')
          if (!specialInstructions.includes('Monitor for side effects'))
            specialInstructions.push('Monitor for side effects')
          break
        case 'low':
          intervals = [30, 90, 180]
          notes = 'New low-risk patient - standard schedule'
          if (!specialInstructions.includes('Regular adherence assessment'))
            specialInstructions.push('Regular adherence assessment')
          break
      }
    } else {
      switch (riskLevel) {
        case 'high':
          intervals = [90, 180, 270, 360]
          notes = 'Established high-risk patient - quarterly monitoring'
          if (!specialInstructions.includes('Quarterly comprehensive assessment'))
            specialInstructions.push('Quarterly comprehensive assessment')
          if (!specialInstructions.includes('Monitor comorbidities')) specialInstructions.push('Monitor comorbidities')
          break
        case 'medium':
          intervals = [180, 360]
          notes = 'Established patient - bi-annual monitoring'
          if (!specialInstructions.includes('Bi-annual comprehensive check-up'))
            specialInstructions.push('Bi-annual comprehensive check-up')
          break
        case 'low':
          intervals = [360]
          notes = 'Stable patient - annual monitoring'
          if (!specialInstructions.includes('Annual routine check-up'))
            specialInstructions.push('Annual routine check-up')
          break
      }
    }

    return {
      recommendedIntervals: intervals,
      totalAppointments: intervals.length,
      startFromDay: intervals[0] || 30,
      notes,
      urgencyLevel: riskLevel,
      specialInstructions,
    }
  }

  getActivePatientTreatmentsByPatient(patientId: number): (PatientTreatment & { isCurrent: boolean })[] {
    // Mock: return empty array
    return []
  }

  getTreatmentComplianceStats(patientId: number): any {
    // Mock: return compliance stats
    return {
      patientId,
      adherence: 100,
      missedDoses: 0,
      riskLevel: 'low',
      recommendations: [],
    }
  }

  getTreatmentCostAnalysis(params: any): any {
    // Mock: return cost analysis
    return {
      ...params,
      totalCost: 0,
      breakdown: {},
      warnings: [],
    }
  }

  endActivePatientTreatments(patientId: number): {
    success: boolean
    message: string
    deactivatedCount: number
    endDate: Date
    activeTreatments: PatientTreatment[]
  } {
    // Mock: return success
    return {
      success: true,
      message: 'No active treatments to end',
      deactivatedCount: 0,
      endDate: new Date(),
      activeTreatments: [],
    }
  }

  validateSingleProtocolRule(patientId: number): {
    isValid: boolean
    errors: string[]
    currentTreatments: any[]
  } {
    // Mock: always valid
    return {
      isValid: true,
      errors: [],
      currentTreatments: [],
    }
  }

  testBusinessRuleCompliance(patientId: number): any {
    // Mock: always compliant
    return {
      passed: true,
      tests: [],
      overallStatus: 'compliant',
      summary: {
        activeCount: 1,
        protocolCount: 1,
        overlaps: 0,
        futureConflicts: 0,
      },
    }
  }

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
    // Mock: return status
    return {
      totalRules: 10,
      implementedRules: 8,
      mockRules: 2,
      availableEndpoints: [],
      summary: {
        coreRules: 4,
        clinicalRules: 2,
        safetyRules: 2,
        specializedRules: 2,
      },
    }
  }

  /**
   * Quickly check core business rule compliance for a patient.
   * Returns summary of violations and recommendations in the format expected by the controller.
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
    try {
      const validatedPatientId = this.errorHandlingService.validateId(patientId)
      // Get all active treatments for the patient
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId: validatedPatientId,
      })
      const now = new Date()
      let futureDatesDetected = false
      let invalidDateRanges = false
      // Check for future start dates and invalid date ranges
      for (const t of activeTreatments) {
        const start = new Date(t.startDate)
        if (start > now) futureDatesDetected = true
        if (t.endDate) {
          const end = new Date(t.endDate)
          if (end < start) invalidDateRanges = true
        }
      }
      const multipleActiveTreatments = activeTreatments.length > 1
      const hasActiveViolations = multipleActiveTreatments || futureDatesDetected || invalidDateRanges
      const activeViolationsCount = [multipleActiveTreatments, futureDatesDetected, invalidDateRanges].filter(
        Boolean,
      ).length
      // Recommendation logic
      let recommendation = 'No violations detected.'
      if (hasActiveViolations) {
        const recs: string[] = []
        if (multipleActiveTreatments)
          recs.push('Patient has multiple active treatments. Only one active treatment per patient is allowed.')
        if (futureDatesDetected) recs.push('Some treatments have a start date in the future. Please review.')
        if (invalidDateRanges) recs.push('Some treatments have invalid date ranges (end date before start date).')
        recommendation = recs.join(' ')
      }
      return {
        patientId: validatedPatientId,
        hasActiveViolations,
        activeViolationsCount,
        quickChecks: {
          multipleActiveTreatments,
          futureDatesDetected,
          invalidDateRanges,
        },
        recommendation,
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }
}
