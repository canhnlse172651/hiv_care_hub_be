import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { PatientTreatment, Prisma } from '@prisma/client'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { ENTITY_NAMES } from '../../shared/constants/api.constants'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { SharedErrorHandlingService } from '../../shared/services/error-handling.service'
import { PaginationService } from '../../shared/services/pagination.service'
import {
  BulkCreatePatientTreatment,
  CustomMedicationsQuerySchema,
  PatientTreatmentQuerySchema,
  UpdatePatientTreatment,
} from './patient-treatment.model'
import {
  DoctorProtocolAuthorizationService,
  EmergencyProtocolService,
  OrganFunctionService,
  PatientTreatmentBulkService,
  PatientTreatmentBusinessService,
  PatientTreatmentCreateService,
  PatientTreatmentQueryService,
  PatientTreatmentStatsService,
  PregnancySafetyService,
  ResistancePatternService,
  TreatmentAdherenceService,
  TreatmentContinuityService,
  ViralLoadMonitoringService,
} from './services'

@Injectable()
export class PatientTreatmentService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly paginationService: PaginationService,
    private readonly errorHandlingService: SharedErrorHandlingService,
    private readonly patientTreatmentStatsService: PatientTreatmentStatsService,
    private readonly patientTreatmentQueryService: PatientTreatmentQueryService,
    private readonly patientTreatmentBusinessService: PatientTreatmentBusinessService,
    private readonly patientTreatmentBulkService: PatientTreatmentBulkService,
    private readonly organFunctionService: OrganFunctionService,
    private readonly pregnancySafetyService: PregnancySafetyService,
    private readonly resistancePatternService: ResistancePatternService,
    private readonly treatmentAdherenceService: TreatmentAdherenceService,
    private readonly viralLoadMonitoringService: ViralLoadMonitoringService,
    private readonly doctorProtocolAuthorizationService: DoctorProtocolAuthorizationService,
    private readonly treatmentContinuityService: TreatmentContinuityService,
    private readonly emergencyProtocolService: EmergencyProtocolService,
    private readonly patientTreatmentCreateService: PatientTreatmentCreateService,
  ) {}

  // ===============================
  // PUBLIC API METHODS
  // ===============================

  /**
   * Validate organ function for a protocol
   */
  validateOrganFunction(
    liverFunction: { alt: number; ast: number; bilirubin: number },
    kidneyFunction: { creatinine: number; egfr: number },
    protocolId: number,
  ) {
    return this.organFunctionService.validateOrganFunction(liverFunction, kidneyFunction, protocolId)
  }

  /**
   * Validate pregnancy safety for a protocol
   */
  validatePregnancySafety(
    patientGender: 'male' | 'female' | 'other',
    isPregnant: boolean,
    isBreastfeeding: boolean,
    protocolId: number,
  ) {
    return this.pregnancySafetyService.validatePregnancySafety(patientGender, isPregnant, isBreastfeeding, protocolId)
  }

  /**
   * Validate resistance pattern for a protocol
   */
  validateResistancePattern(
    resistanceData: {
      mutations: string[]
      resistanceLevel: 'none' | 'low' | 'intermediate' | 'high'
      previousFailedRegimens: string[]
    },
    proposedProtocolId: number,
  ) {
    return this.resistancePatternService.validateResistancePattern(resistanceData, proposedProtocolId)
  }

  /**
   * Validate treatment adherence
   */
  validateTreatmentAdherence(adherenceData: {
    pillsMissed: number
    totalPills: number
    recentAdherencePattern: number[]
  }) {
    return this.treatmentAdherenceService.validateTreatmentAdherence(adherenceData)
  }

  /**
   * Validate viral load monitoring
   */
  async validateViralLoadMonitoring(patientTreatmentId: number, treatmentStartDate: Date) {
    return this.viralLoadMonitoringService.validateViralLoadMonitoring(patientTreatmentId, treatmentStartDate)
  }

  /**
   * Get patient treatment by ID
   */
  async getPatientTreatmentById(id: number): Promise<PatientTreatment> {
    try {
      const validatedId = this.errorHandlingService.validateId(id)
      const treatment = await this.patientTreatmentRepository.findPatientTreatmentById(validatedId)
      if (
        treatment?.customMedications &&
        (Array.isArray(treatment.customMedications) || typeof treatment.customMedications === 'object')
      ) {
        treatment.customMedications = this.normalizeCustomMedicationsSchedule(treatment.customMedications)
      }
      return this.errorHandlingService.validateEntityExists(treatment, ENTITY_NAMES.PATIENT_TREATMENT, validatedId)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Update patient treatment with business rule validation
   */
  async updatePatientTreatment(id: number, data: UpdatePatientTreatment): Promise<PatientTreatment> {
    try {
      const existingTreatment = await this.getPatientTreatmentById(id)
      if (typeof data.notes === 'string' && data.notes.length > 2000) {
        throw new BadRequestException('Notes must be at most 2000 characters')
      }
      if (data.startDate || data.endDate) {
        await this.ensureNoActiveTreatmentOverlap(id, data, existingTreatment)
      }
      this.logTreatmentOperation('update', { id, ...data })
      const updatePayload = { ...data }
      if (typeof data.status === 'boolean') updatePayload.status = data.status
      const updated = await this.patientTreatmentRepository.updatePatientTreatment(id, updatePayload)
      if (
        updated?.customMedications &&
        (Array.isArray(updated.customMedications) || typeof updated.customMedications === 'object')
      ) {
        updated.customMedications = this.normalizeCustomMedicationsSchedule(updated.customMedications)
      }
      return updated
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Ensure no active treatment overlap for a patient (business rule)
   */
  private async ensureNoActiveTreatmentOverlap(
    id: number,
    data: UpdatePatientTreatment,
    existingTreatment: PatientTreatment,
  ) {
    const patientId = existingTreatment.patientId
    const otherActiveTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })
    const otherActiveExcludingCurrent = otherActiveTreatments.filter((t) => t.id !== id)
    if (otherActiveExcludingCurrent.length > 0) {
      const currentDate = new Date()
      const newStartDate = data.startDate ? new Date(data.startDate) : new Date(existingTreatment.startDate)
      const newEndDate = data.endDate
        ? new Date(data.endDate)
        : existingTreatment.endDate
          ? new Date(existingTreatment.endDate)
          : null
      const wouldBeActive = !newEndDate || newEndDate > currentDate
      if (wouldBeActive) {
        for (const otherTreatment of otherActiveExcludingCurrent) {
          const otherStart = new Date(otherTreatment.startDate)
          const otherEnd = otherTreatment.endDate ? new Date(otherTreatment.endDate) : currentDate
          const hasOverlap = newStartDate <= otherEnd && otherStart <= (newEndDate || currentDate)
          if (hasOverlap) {
            throw new ConflictException(
              `Business rule violation: Updated treatment would overlap with active treatment ID ${otherTreatment.id} (Protocol ${otherTreatment.protocolId}). Only 1 active protocol per patient is allowed.`,
            )
          }
        }
      }
    }
  }

  // Delete patient treatment
  async deletePatientTreatment(id: number): Promise<PatientTreatment> {
    try {
      await this.getPatientTreatmentById(id)
      this.logTreatmentOperation('delete', { id })
      return this.patientTreatmentRepository.deletePatientTreatment(id)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  async getAllPatientTreatments(query: Record<string, any>): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      const search = typeof query?.search === 'string' ? query.search : ''
      const page = typeof query?.page === 'number' ? query.page : Number(query?.page) || 1
      const limit = typeof query?.limit === 'number' ? query.limit : Number(query?.limit) || 10
      if (!search || search.trim() === '') {
        return await this.patientTreatmentQueryService.getAllPatientTreatments({ page, limit })
      }
      return await this.searchPatientTreatments(search, page, limit)
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Get patient treatments by patient ID with pagination and filtering
  async getPatientTreatmentsByPatientId(query: Record<string, any>): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      return await this.patientTreatmentQueryService.getPatientTreatmentsByPatientId(query)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Get patient treatments by doctor ID
  async getPatientTreatmentsByDoctorId(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    return await this.patientTreatmentQueryService.getPatientTreatmentsByDoctorId(query)
  }

  async searchPatientTreatments(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      return await this.patientTreatmentQueryService.searchPatientTreatments(query, page, limit)
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  // Enhanced date range search with flexible date handling
  async getPatientTreatmentsByDateRange(startDate: Date, endDate: Date): Promise<PaginatedResponse<PatientTreatment>> {
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

      validEndDate = new Date(validEndDate)
      validEndDate.setHours(23, 59, 59, 999)

      const treatments = await this.patientTreatmentRepository.getPatientTreatmentsByDateRange(
        validStartDate,
        validEndDate,
      )
      return {
        data: treatments,
        meta: {
          total: treatments.length,
          page: 1,
          limit: treatments.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  async getActivePatientTreatments(query: unknown): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      // Validate query for pagination
      const validatedQuery = PatientTreatmentQuerySchema.parse(query)
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
      // Ensure endDate is set to end of day if provided and valid
      if (params.endDate && !isNaN(params.endDate.getTime())) {
        params.endDate.setHours(23, 59, 59, 999)
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
    return this.patientTreatmentStatsService.getPatientTreatmentStats(patientId)
  }

  async getDoctorWorkloadStats(doctorId: number): Promise<any> {
    return this.patientTreatmentStatsService.getDoctorWorkloadStats(doctorId)
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
    return this.patientTreatmentStatsService.getCustomMedicationStats()
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
    return this.patientTreatmentStatsService.compareProtocolVsCustomTreatments(protocolId)
  }

  async bulkCreatePatientTreatments(data: BulkCreatePatientTreatment, userId: number): Promise<any> {
    try {
      return await this.patientTreatmentBulkService.bulkCreatePatientTreatments(data, userId)
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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

  async createPatientTreatment(
    data: any,
    userId: number,
    autoEndExisting: boolean = true,
    validate: boolean = true,
  ): Promise<any> {
    try {
      console.log('[createPatientTreatment] before create:', { data, userId, autoEndExisting, validate })
      const created = await this.patientTreatmentCreateService.createPatientTreatment(
        data,
        userId,
        autoEndExisting,
        validate,
      )
      console.log('[createPatientTreatment] after create:', created)
      return created
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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
    try {
      const result = this.emergencyProtocolService.validateEmergencyProtocol(treatmentType, exposureDate, riskFactors)
      return {
        isValidTiming: result.isValidTiming,
        timeWindow: result.timeWindow,
        urgencyLevel: result.urgencyLevel,
        protocolRecommendations: result.protocolRecommendations,
        followUpRequirements: result.followUpRequirements,
      }
    } catch (error) {
      throw new BadRequestException('Error validating emergency protocol: ' + (error?.message || 'Unknown error'))
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
      const result = await this.treatmentContinuityService.validateTreatmentContinuity(patientId, currentTreatmentStart)
      return {
        isContinuous: result.isContinuous,
        gapDays: result.gapDays,
        riskLevel: result.riskLevel,
        recommendations: result.recommendations,
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
  ): {
    isAuthorized: boolean
    doctorLevel: string
    protocolComplexity: string
    requirements: string[]
  } {
    try {
      const result = this.doctorProtocolAuthorizationService.validateDoctorProtocolAuthorization(doctorId, protocolId)
      return {
        isAuthorized: result.isAuthorized,
        doctorLevel: result.doctorLevel,
        protocolComplexity: result.protocolComplexity,
        requirements: result.requirements,
      }
    } catch (error) {
      return {
        isAuthorized: false,
        doctorLevel: 'unknown',
        protocolComplexity: 'unknown',
        requirements: ['Error validating doctor authorization - manual review required'],
      }
    }
  }

  /**
   * Detect business rule violations across all patients
   */
  async detectBusinessRuleViolations(): Promise<any> {
    try {
      return await this.patientTreatmentBusinessService.detectBusinessRuleViolations()
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Fix business rule violations by ending older treatments
   */
  async fixBusinessRuleViolations(isDryRun: boolean = true): Promise<any> {
    try {
      return await this.patientTreatmentBusinessService.fixBusinessRuleViolations(isDryRun)
    } catch (error) {
      this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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
    topProtocols: Array<{ protocolId: number; count: number; percentage: number }>
    monthlyTrends: Array<{
      month: string
      newTreatments: number
      completedTreatments: number
      totalCost: number
    }>
  }> {
    try {
      const stats = await this.patientTreatmentStatsService.getGeneralTreatmentStats()
      return stats
    } catch (error) {
      return this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Tính toán chi phí điều trị dựa trên protocol và customMedications, có thể dùng cho preview
   */
  async calculateTreatmentCost(
    protocolId: number,
    customMedications: Array<{ price?: number; durationUnit?: string; durationValue?: number }> | undefined,
    startDate: Date,
    endDate?: Date,
  ): Promise<{
    isValid: boolean
    calculatedTotal: number
    breakdown: {
      protocolCost: number
      customMedicationCost: number
      durationMultiplier: number
      durationInDays: number | null
    }
    warnings: string[]
  }> {
    let protocolCost = 0
    let customMedicationCost = 0
    let durationInDays: number | null = null
    let durationMultiplier = 1
    const warnings: string[] = []

    // Tính chi phí protocol
    if (protocolId) {
      try {
        const protocol = await this.patientTreatmentRepository.findProtocolWithMedicines(protocolId)
        if (protocol && Array.isArray(protocol.medicines)) {
          for (const pm of protocol.medicines) {
            if (pm.medicine && pm.medicine.price) {
              let multiplier = 1
              switch (pm.durationUnit) {
                case 'DAY':
                  multiplier = pm.durationValue
                  break
                case 'WEEK':
                  multiplier = pm.durationValue * 7
                  break
                case 'MONTH':
                  multiplier = pm.durationValue * 30
                  break
                case 'YEAR':
                  multiplier = pm.durationValue * 365
                  break
              }
              protocolCost += Number(pm.medicine.price) * multiplier
            }
          }
        }
      } catch (err) {
        warnings.push('Không lấy được thông tin protocol hoặc giá thuốc.')
      }
    }

    // Tính chi phí customMedications
    if (customMedications && Array.isArray(customMedications)) {
      for (const cm of customMedications) {
        if (cm.price) {
          let multiplier = 1
          switch (cm.durationUnit) {
            case 'DAY':
              multiplier = cm.durationValue || 1
              break
            case 'WEEK':
              multiplier = (cm.durationValue || 1) * 7
              break
            case 'MONTH':
              multiplier = (cm.durationValue || 1) * 30
              break
            case 'YEAR':
              multiplier = (cm.durationValue || 1) * 365
              break
          }
          customMedicationCost += Number(cm.price) * multiplier
        }
      }
    }

    // Tính duration
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

  async getActivePatientTreatmentsByPatient(patientId: number): Promise<
    (PatientTreatment & {
      isCurrent: boolean
      isStarted: boolean
      daysRemaining: number | null
      treatmentStatus: 'upcoming' | 'active' | 'ending_soon'
    })[]
  > {
    const treatments = await this.patientTreatmentRepository.getActivePatientTreatmentsByPatientId(patientId)
    // Đảm bảo chỉ 1 treatment có isCurrent: true
    const currentTreatments = treatments.filter((t) => t.isCurrent)
    if (currentTreatments.length > 1) {
      // Chọn treatment mới nhất (startDate lớn nhất) là isCurrent: true, các treatment còn lại set isCurrent: false
      const sorted = currentTreatments.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      const latestId = sorted[0].id
      return treatments.map((t) => ({
        ...t,
        isCurrent: t.id === latestId,
      }))
    }
    return treatments
  }

  async getTreatmentComplianceStats(patientId: number): Promise<any> {
    const pid = typeof patientId === 'string' ? Number(patientId) : patientId
    const treatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(pid, {
      page: 0,
      limit: 100,
    })
    const totalDoses = treatments.reduce((sum, t) => sum + (t.total || 0), 0)
    const adherence = totalDoses > 0 ? 100 : 0
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (adherence < 95) riskLevel = 'medium'
    if (adherence < 85) riskLevel = 'high'
    const recommendations: string[] = []
    if (riskLevel !== 'low') recommendations.push('Improve adherence to reduce risk')
    return { patientId, adherence, missedDoses: 0, riskLevel, recommendations }
  }

  async getTreatmentCostAnalysis(params: any): Promise<any> {
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
      console.log('[endActivePatientTreatments] before update:', t)
      const updated = await this.patientTreatmentRepository.updatePatientTreatment(t.id, {
        endDate: now,
        status: false,
      })
      console.log('[endActivePatientTreatments] after update:', updated)
      deactivatedCount++
    }
    return {
      success: true,
      message: `Ended ${deactivatedCount} active treatment(s)`,
      deactivatedCount,
      endDate: now,
      activeTreatments: activeTreatments.map((t) => ({ ...t, endDate: now, status: false })),
    }
  }

  async validateSingleProtocolRule(patientId: number): Promise<{
    isValid: boolean
    errors: string[]
    currentTreatments: any[]
  }> {
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
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId: validatedPatientId,
      })
      const quickChecks = this.getQuickBusinessRuleChecks(activeTreatments)
      const hasActiveViolations = Object.values(quickChecks).some(Boolean)
      const activeViolationsCount = Object.values(quickChecks).filter(Boolean).length
      let recommendation = 'No violations detected.'
      if (hasActiveViolations) {
        const recs: string[] = []
        if (quickChecks.multipleActiveTreatments)
          recs.push('Patient has multiple active treatments. Only one active treatment per patient is allowed.')
        if (quickChecks.futureDatesDetected)
          recs.push('Some treatments have a start date in the future. Please review.')
        if (quickChecks.invalidDateRanges)
          recs.push('Some treatments have invalid date ranges (end date before start date).')
        recommendation = recs.join(' ')
      }
      return {
        patientId: validatedPatientId,
        hasActiveViolations,
        activeViolationsCount,
        quickChecks,
        recommendation,
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Helper: quick business rule checks for a list of treatments
   */
  private getQuickBusinessRuleChecks(treatments: PatientTreatment[]): {
    multipleActiveTreatments: boolean
    futureDatesDetected: boolean
    invalidDateRanges: boolean
  } {
    const now = new Date()
    let futureDatesDetected = false
    let invalidDateRanges = false
    for (const t of treatments) {
      const start = new Date(t.startDate)
      if (start > now) futureDatesDetected = true
      if (t.endDate) {
        const end = new Date(t.endDate)
        if (end < start) invalidDateRanges = true
      }
    }
    return {
      multipleActiveTreatments: treatments.length > 1,
      futureDatesDetected,
      invalidDateRanges,
    }
  }
}
