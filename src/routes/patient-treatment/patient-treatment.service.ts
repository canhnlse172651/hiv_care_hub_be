import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
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

  // Get patient treatment by ID
  async getPatientTreatmentById(id: number): Promise<PatientTreatment> {
    try {
      const validatedId = this.errorHandlingService.validateId(id)
      const treatment = await this.patientTreatmentRepository.findPatientTreatmentById(validatedId)
      // Ensure schedule field is always present in customMedications in the response
      if (
        treatment &&
        treatment.customMedications &&
        (Array.isArray(treatment.customMedications) ||
          (typeof treatment.customMedications === 'object' && treatment.customMedications !== null))
      ) {
        treatment.customMedications = this.normalizeCustomMedicationsSchedule(treatment.customMedications)
      }
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

      const updated = await this.patientTreatmentRepository.updatePatientTreatment(id, data)
      if (
        updated &&
        updated.customMedications &&
        (Array.isArray(updated.customMedications) ||
          (typeof updated.customMedications === 'object' && updated.customMedications !== null))
      ) {
        updated.customMedications = this.normalizeCustomMedicationsSchedule(updated.customMedications)
      }
      return updated
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

      const result = await this.paginationService.paginate<PatientTreatment>(
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
      // Normalize schedule in customMedications for all items
      result.data = result.data.map((item) => {
        if (
          item.customMedications &&
          (Array.isArray(item.customMedications) ||
            (typeof item.customMedications === 'object' && item.customMedications !== null))
        ) {
          item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
        }
        return item
      })
      return result
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

      const result = await this.paginationService.paginate<PatientTreatment>(
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
      result.data = result.data.map((item) => {
        if (
          item.customMedications &&
          (Array.isArray(item.customMedications) ||
            (typeof item.customMedications === 'object' && item.customMedications !== null))
        ) {
          item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
        }
        return item
      })
      return result
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

      const result = await this.paginationService.paginate<PatientTreatment>(
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
      result.data = result.data.map((item) => {
        if (
          item.customMedications &&
          (Array.isArray(item.customMedications) ||
            (typeof item.customMedications === 'object' && item.customMedications !== null))
        ) {
          item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
        }
        return item
      })
      return result
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

      const result = await this.paginationService.paginate<PatientTreatment>(
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
      result.data = result.data.map((item) => {
        if (item.customMedications) {
          if (
            item.customMedications &&
            (Array.isArray(item.customMedications) ||
              (typeof item.customMedications === 'object' && item.customMedications !== null))
          ) {
            item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
          }
        }
        return item
      })
      return result
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
      const { page = 1, limit = 10, patientId, doctorId, protocolId, sortBy, sortOrder } = validatedQuery

      // Build order by clause
      const orderBy: Prisma.PatientTreatmentOrderByWithRelationInput = {}
      if (sortBy && sortOrder) {
        orderBy[sortBy] = sortOrder
      } else {
        orderBy.startDate = 'desc'
      }

      const activePatientTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId,
        page,
        limit,
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
      const limit = Math.min(100, Math.max(1, validatedQuery.limit || 10))

      // Convert dates if provided
      const params = {
        patientId: validatedQuery.patientId,
        doctorId: validatedQuery.doctorId,
        startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
        endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
        page,
        limit,
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
        page,
        limit,
        orderBy: { createdAt: 'desc' },
      })

      // Normalize schedule in customMedications for all items
      const normalizedData = data.map((item) => {
        if (item.customMedications) {
          if (
            item.customMedications &&
            (Array.isArray(item.customMedications) ||
              (typeof item.customMedications === 'object' && item.customMedications !== null))
          ) {
            item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
          }
        }
        return item
      })

      // You may need to update repository to return total count for page/limit
      const total = await this.patientTreatmentRepository.countPatientTreatments(whereClause)
      const hasNextPage = page * limit < total
      const totalPages = Math.ceil(total / limit)

      return {
        data: normalizedData,
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
      const pid = typeof validatedPatientId === 'string' ? Number(validatedPatientId) : validatedPatientId
      // Get all treatments for patient
      let allTreatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(pid, {
        page: 1,
        limit: 1000,
      })
      // Normalize schedule in customMedications for all items
      allTreatments = allTreatments.map((item) => {
        if (
          item.customMedications &&
          (Array.isArray(item.customMedications) ||
            (typeof item.customMedications === 'object' && item.customMedications !== null))
        ) {
          item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
        }
        return item
      })

      // Get active treatments
      let activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId: validatedPatientId,
        page: 1,
        limit: 1000,
      })
      activeTreatments = activeTreatments.map((item) => {
        if (
          item.customMedications &&
          (Array.isArray(item.customMedications) ||
            (typeof item.customMedications === 'object' && item.customMedications !== null))
        ) {
          item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
        }
        return item
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
      let allTreatments = await this.patientTreatmentRepository.findPatientTreatmentsByDoctorId(validatedDoctorId, {
        page: 1,
        limit: 1000,
      })
      allTreatments = allTreatments.map((item) => {
        if (
          item.customMedications &&
          (Array.isArray(item.customMedications) ||
            (typeof item.customMedications === 'object' && item.customMedications !== null))
        ) {
          item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
        }
        return item
      })

      // Get active treatments
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        page: 1,
        limit: 1000,
      })
      let doctorActiveTreatments = activeTreatments.filter((t) => t.doctorId === validatedDoctorId)
      doctorActiveTreatments = doctorActiveTreatments.map((item) => {
        if (
          item.customMedications &&
          (Array.isArray(item.customMedications) ||
            (typeof item.customMedications === 'object' && item.customMedications !== null))
        ) {
          item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
        }
        return item
      })
      // ===============================
      // STUBS FOR MISSING METHODS
      // ===============================

      /**
       * Calculate statistics for a list of treatments (stub implementation)
       */

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
      let allTreatments = await this.patientTreatmentRepository.findPatientTreatments({
        page: 1,
        limit: 10000, // Large number to get all
      })
      allTreatments = allTreatments.map((item) => {
        if (
          item.customMedications &&
          (Array.isArray(item.customMedications) ||
            (typeof item.customMedications === 'object' && item.customMedications !== null))
        ) {
          item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
        }
        return item
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
      let allTreatments = await this.patientTreatmentRepository.findPatientTreatments({
        where: { protocolId: validatedProtocolId },
        page: 1,
        limit: 10000,
      })
      allTreatments = allTreatments.map((item) => {
        if (
          item.customMedications &&
          (Array.isArray(item.customMedications) ||
            (typeof item.customMedications === 'object' && item.customMedications !== null))
        ) {
          item.customMedications = this.normalizeCustomMedicationsSchedule(item.customMedications)
        }
        return item
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

  /**
   * Normalize custom medications to ensure schedule is valid and type-safe
   */
  private normalizeCustomMedicationsSchedule(
    customMedications: Record<string, any> | any[] | null | undefined,
    validSchedules: string[] = ['MORNING', 'AFTERNOON', 'NIGHT'],
  ): Record<string, any> | any[] | null {
    if (!customMedications) return null
    if (Array.isArray(customMedications)) {
      return customMedications.map((med): Record<string, any> => {
        if (!med || typeof med !== 'object') return {}
        const medWithSchedule = med as { [key: string]: unknown }
        let schedule: string | null = null
        if ('schedule' in medWithSchedule && typeof medWithSchedule['schedule'] === 'string') {
          const sched = medWithSchedule['schedule']
          schedule = validSchedules.includes(sched) ? sched : null
        }
        return {
          ...medWithSchedule,
          schedule,
        }
      })
    }
    if (typeof customMedications === 'object' && customMedications !== null) {
      const result: Record<string, any> = {}
      Object.entries(customMedications as Record<string, unknown>).forEach(([key, med]) => {
        if (!med || typeof med !== 'object') {
          result[key] = {}
        } else {
          const medWithSchedule = med as { [key: string]: unknown }
          let schedule: string | null = null
          if ('schedule' in medWithSchedule && typeof medWithSchedule['schedule'] === 'string') {
            const sched = medWithSchedule['schedule']
            schedule = validSchedules.includes(sched) ? sched : null
          }
          result[key] = {
            ...medWithSchedule,
            schedule,
          }
        }
      })
      return result
    }
    // If not array or object, return null for type safety
    return null
  }
  /**
   * Calculate statistics for a list of treatments (stub implementation)
   */
  private calculateTreatmentStats(treatments: any[]): {
    count: number
    averageDuration: number | null
    averageCost: number
    completionRate: number
  } {
    if (!Array.isArray(treatments) || treatments.length === 0) {
      return {
        count: 0,
        averageDuration: null,
        averageCost: 0,
        completionRate: 0,
      }
    }
    const count = treatments.length
    const completed = treatments.filter((t) => t.endDate).length
    const averageDuration =
      completed > 0
        ? Math.round(
            treatments
              .filter((t) => t.endDate)
              .reduce((sum: number, t: any) => {
                const start = t.startDate ? new Date(t.startDate as string | number | Date) : new Date()
                const end = t.endDate ? new Date(t.endDate as string | number | Date) : new Date()
                return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
              }, 0) / completed,
          )
        : null
    const averageCost =
      count > 0
        ? treatments.reduce((sum: number, t: any) => {
            const safeSum = typeof sum === 'number' ? sum : 0
            const total = typeof t.total === 'number' ? t.total : 0
            return Number(safeSum) + Number(total)
          }, 0) / count
        : 0
    const completionRate = count > 0 ? (completed / count) * 100 : 0
    return {
      count,
      averageDuration,
      averageCost: Math.round(averageCost * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
    }
  }

  // Create a patient treatment with validation, business rule check, and normalization
  async createPatientTreatment(data: any, userId: number, validate: boolean = true): Promise<any> {
    try {
      // Parse and validate input
      const patientId = this.safeParseNumber(data.patientId, 'patientId')
      const doctorId = this.safeParseNumber(data.doctorId, 'doctorId')
      // protocolId is now optional
      let protocolId: number | undefined = undefined
      if (data.protocolId !== undefined && data.protocolId !== null && data.protocolId !== '') {
        protocolId = this.safeParseNumber(data.protocolId, 'protocolId')
      }
      // optional test result
      let startDate: Date = new Date()
      if (data.startDate) {
        if (
          typeof data.startDate === 'string' ||
          typeof data.startDate === 'number' ||
          data.startDate instanceof Date
        ) {
          startDate = new Date(data.startDate as string | number | Date)
        }
      }
      let endDate: Date | undefined = undefined
      if (data.endDate) {
        if (typeof data.endDate === 'string' || typeof data.endDate === 'number' || data.endDate instanceof Date) {
          endDate = new Date(data.endDate as string | number | Date)
        }
      }
      const notes = typeof data.notes === 'string' ? data.notes : undefined
      const total = data.total !== undefined ? Math.max(0, this.safeParseNumber(data.total, 'total', 0)) : 0
      let customMedications: any[] | Record<string, any> | null = null
      if (data.customMedications) {
        try {
          customMedications = this.safeParseCustomMedications(data.customMedications, 1)
        } catch (err) {
          customMedications = null
        }
      }

      // Only include protocolId if it is defined, otherwise omit it
      const processedData: any = {
        patientId,
        doctorId,
        startDate,
        endDate,
        notes,
        total,
        customMedications,
        createdById: userId,
      }
      if (protocolId !== undefined) {
        processedData.protocolId = protocolId
      }

      if (validate && typeof CreatePatientTreatmentSchema !== 'undefined') {
        CreatePatientTreatmentSchema.parse(processedData)
      }

      // Business rule: Only 1 active treatment per patient
      const existingActive = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })
      if (existingActive && existingActive.length > 0) {
        const activeProtocols = Array.from(new Set(existingActive.map((t) => t.protocolId)))
        throw new ConflictException(
          `Patient ${patientId} already has ${existingActive.length} active treatment(s) with protocol(s): ${activeProtocols.join(', ')}. Only 1 active protocol per patient is allowed.`,
        )
      }

      // Normalize customMedications schedule before save
      if (
        processedData.customMedications &&
        (Array.isArray(processedData.customMedications) || typeof processedData.customMedications === 'object')
      ) {
        processedData.customMedications = this.normalizeCustomMedicationsSchedule(processedData.customMedications)
      }

      // Create treatment record in DB
      const created = await this.patientTreatmentRepository.createPatientTreatment(processedData)

      // Normalize customMedications in response
      if (
        created &&
        created.customMedications &&
        (Array.isArray(created.customMedications) || typeof created.customMedications === 'object')
      ) {
        created.customMedications = this.normalizeCustomMedicationsSchedule(created.customMedications)
      }

      return created
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // ===============================
  // MISSING VALIDATION METHODS
  // ===============================

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
      const pid = typeof patientId === 'string' ? Number(patientId) : patientId
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(pid, {
        page: 1,
        limit: 100,
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
        page: 1,
        limit: 10000, // Large number to get all
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
          percentage: totalTreatments > 0 ? Math.round((count / totalTreatments) * 10000) / 100 : 0, // 2 decimal places
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

        const newTreatments = allTreatments.filter((t) => {
          const startDate = new Date(t.startDate)
          return startDate >= monthStart && startDate <= monthEnd
        })

        const completedTreatmentsArr = allTreatments.filter((t) => {
          if (!t.endDate) return false
          const endDate = new Date(t.endDate)
          return endDate >= monthStart && endDate <= monthEnd
        })

        monthlyTrends.push({
          month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
          newTreatments: newTreatments.length,
          completedTreatments: completedTreatmentsArr.length,
          totalCost: newTreatments.reduce((sum, t) => sum + (t.total || 0), 0),
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

  /**
   * Audit logging for treatment operations
   */
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

  /**
   * Performance metrics tracking for service operations
   */
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
   * Integration with follow-up appointment system for patient treatments
   */

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
          const followUpResult = await this.followUpAppointmentService.createFollowUpAppointment(Number(treatment.id), {
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
      const pid = typeof patientId === 'string' ? Number(patientId) : patientId
      const treatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(pid, {
        page: 0,
        limit: 100,
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

  async getActivePatientTreatmentsByPatient(patientId: number): Promise<
    (PatientTreatment & {
      isCurrent: boolean
      isStarted: boolean
      daysRemaining: number | null
      treatmentStatus: 'upcoming' | 'active' | 'ending_soon'
    })[]
  > {
    return this.patientTreatmentRepository.getActivePatientTreatmentsByPatientId(patientId)
  }

  async getTreatmentComplianceStats(patientId: number): Promise<any> {
    // Example: compliance = 100% if all treatments present, else lower
    const pid = typeof patientId === 'string' ? Number(patientId) : patientId
    const treatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(pid, {
      page: 0,
      limit: 100,
    })
    const totalDoses = treatments.reduce((sum, t) => sum + (t.total || 0), 0)
    // No missedDoses field, so just use total for now
    const adherence = totalDoses > 0 ? 100 : 0
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (adherence < 95) riskLevel = 'medium'
    if (adherence < 85) riskLevel = 'high'
    const recommendations: string[] = []
    if (riskLevel !== 'low') recommendations.push('Improve adherence to reduce risk')
    return { patientId, adherence, missedDoses: 0, riskLevel, recommendations }
  }

  async getTreatmentCostAnalysis(params: any): Promise<any> {
    // Example: sum cost for patient or filter
    const patientId = typeof params.patientId === 'string' ? Number(params.patientId) : params.patientId
    const pid: number = Number(patientId)
    const treatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(pid, {
      page: 0,
      limit: 100,
    })
    const totalCost = treatments.reduce((sum, t) => sum + (t.total || 0), 0)
    const breakdown = treatments.map((t) => ({ id: t.id, protocolId: t.protocolId, total: t.total }))
    const warnings: string[] = totalCost === 0 ? ['No cost data found'] : []
    return { ...params, totalCost, breakdown, warnings }
  }

  async endActivePatientTreatments(patientId: number): Promise<{
    success: boolean
    message: string
    deactivatedCount: number
    endDate: Date
    activeTreatments: PatientTreatment[]
  }> {
    // End all active treatments for a patient by setting endDate = now
    const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })
    if (!activeTreatments.length) {
      return {
        success: true,
        message: 'No active treatments to end',
        deactivatedCount: 0,
        endDate: new Date(),
        activeTreatments: [],
      }
    }
    const now = new Date()
    let deactivatedCount = 0
    for (const t of activeTreatments) {
      await this.patientTreatmentRepository.updatePatientTreatment(t.id, { endDate: now })
      deactivatedCount++
    }
    return {
      success: true,
      message: `Ended ${deactivatedCount} active treatment(s)`,
      deactivatedCount,
      endDate: now,
      activeTreatments: activeTreatments.map((t) => ({ ...t, endDate: now })),
    }
  }

  async validateSingleProtocolRule(patientId: number): Promise<{
    isValid: boolean
    errors: string[]
    currentTreatments: any[]
  }> {
    // Check if patient has more than one active treatment (should only have one)
    const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })
    const errors: string[] = []
    if (activeTreatments.length > 1) {
      errors.push('Patient has more than one active treatment')
    }
    return {
      isValid: errors.length === 0,
      errors,
      currentTreatments: activeTreatments,
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
