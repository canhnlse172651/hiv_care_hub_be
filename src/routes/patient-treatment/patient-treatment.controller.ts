import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PatientTreatment } from '@prisma/client'
import CustomZodValidationPipe from '../../common/custom-zod-validate'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { Auth } from '../../shared/decorators/auth.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import {
  ApiBulkCreatePatientTreatments,
  ApiCompareProtocolVsCustomTreatments,
  ApiCreatePatientTreatment,
  ApiDeletePatientTreatment,
  ApiEndActivePatientTreatments,
  ApiGetActivePatientTreatments,
  ApiGetActivePatientTreatmentsByPatient,
  ApiGetAllPatientTreatments,
  ApiGetCustomMedicationStats,
  ApiGetDoctorWorkloadStats,
  ApiGetPatientTreatmentById,
  ApiGetPatientTreatmentsByDateRange,
  ApiGetPatientTreatmentsByDoctor,
  ApiGetPatientTreatmentsByPatient,
  ApiGetPatientTreatmentStats,
  ApiGetTreatmentComplianceStats,
  ApiGetTreatmentCostAnalysis,
  ApiGetTreatmentsWithCustomMedications,
  ApiSearchPatientTreatments,
  ApiUpdatePatientTreatment,
} from '../../swagger/patient-treatment.swagger'
import {
  BulkCreatePatientTreatmentDto,
  CreatePatientTreatmentDto,
  CreatePatientTreatmentDtoType,
  PatientTreatmentQueryDto,
  UpdatePatientTreatmentDto,
} from './patient-treatment.dto'
import { PatientTreatmentService } from './patient-treatment.service'

@ApiBearerAuth()
@ApiTags('Patient Treatment Management')
@Controller('patient-treatments')
@Auth([AuthType.Bearer])
export class PatientTreatmentController {
  constructor(private readonly patientTreatmentService: PatientTreatmentService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreatePatientTreatment()
  async createPatientTreatment(
    @Body(new CustomZodValidationPipe(CreatePatientTreatmentDto))
    data: CreatePatientTreatmentDtoType,
    @CurrentUser() user: any,
    @Query('autoEndExisting') autoEndExisting?: string,
  ): Promise<PatientTreatment> {
    // Use userId from JWT payload
    const userId = user.userId || user.id
    const shouldAutoEnd = autoEndExisting === 'true'

    if (shouldAutoEnd) {
      return this.patientTreatmentService.createPatientTreatment(data, Number(userId), true)
    } else {
      return this.patientTreatmentService.createPatientTreatment(data, Number(userId), false)
    }
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetAllPatientTreatments()
  async getAllPatientTreatments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const query = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      startDate,
      endDate,
    }
    return this.patientTreatmentService.getAllPatientTreatments(query)
  }

  @Get('patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentsByPatient()
  async getPatientTreatmentsByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeCompleted') includeCompleted?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    // If user is a patient, they can only see their own treatments
    const userId = user.userId || user.id
    if (user.role?.name === 'PATIENT' && Number(userId) !== patientId) {
      throw new ForbiddenException('Patients can only access their own treatment records')
    }

    const query = {
      patientId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      includeCompleted: includeCompleted === 'true' || includeCompleted === undefined,
      startDate,
      endDate,
    }

    return this.patientTreatmentService.getPatientTreatmentsByPatientId(query)
  }

  @Get('doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetPatientTreatmentsByDoctor()
  async getPatientTreatmentsByDoctor(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const query = {
      doctorId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    }

    return this.patientTreatmentService.getPatientTreatmentsByDoctorId(query)
  }

  // ===============================
  // SEARCH AND ADVANCED QUERIES
  // ===============================

  @Get('search')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiSearchPatientTreatments()
  async searchPatientTreatments(
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const searchQuery = search || q || query || ''
    const pageNum = page ? Number(page) : 1
    const limitNum = limit ? Number(limit) : 10

    return this.patientTreatmentService.searchPatientTreatments(searchQuery, pageNum, limitNum)
  }

  @Get('date-range')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetPatientTreatmentsByDateRange()
  async getPatientTreatmentsByDateRange(
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ): Promise<PatientTreatment[]> {
    const startDate = startDateStr ? new Date(startDateStr) : new Date()
    const endDate = endDateStr ? new Date(endDateStr) : new Date()
    return this.patientTreatmentService.getPatientTreatmentsByDateRange(startDate, endDate)
  }

  @Get('active')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetActivePatientTreatments()
  async getActivePatientTreatments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('protocolId') protocolId?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const query = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      patientId: patientId ? Number(patientId) : undefined,
      doctorId: doctorId ? Number(doctorId) : undefined,
      protocolId: protocolId ? Number(protocolId) : undefined,
    }
    return this.patientTreatmentService.getActivePatientTreatments(query)
  }

  @Get('active/patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetActivePatientTreatmentsByPatient()
  async getActivePatientTreatmentsByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
  ): Promise<(PatientTreatment & { isCurrent: boolean })[]> {
    // If user is a patient, they can only see their own treatments
    const userId = user.userId || user.id
    if (user.role?.name === 'PATIENT' && Number(userId) !== patientId) {
      throw new ForbiddenException('Patients can only access their own treatment records')
    }

    return this.patientTreatmentService.getActivePatientTreatmentsByPatient(patientId)
  }

  @Get('custom-medications')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentsWithCustomMedications()
  async getTreatmentsWithCustomMedications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('hasCustomMeds') hasCustomMeds?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const query = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      hasCustomMeds: hasCustomMeds === 'true',
    }
    return this.patientTreatmentService.findTreatmentsWithCustomMedications(query)
  }

  @Get('stats/patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentStats()
  async getPatientTreatmentStats(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
  ): Promise<any> {
    // If user is a patient, they can only see their own stats
    if (user.role?.name === 'PATIENT' && Number(user.id) !== patientId) {
      throw new ForbiddenException('Patients can only access their own statistics')
    }
    return this.patientTreatmentService.getPatientTreatmentStats(patientId)
  }

  @Get('stats/doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetDoctorWorkloadStats()
  async getDoctorWorkloadStats(@Param('doctorId', ParseIntPipe) doctorId: number): Promise<any> {
    return this.patientTreatmentService.getDoctorWorkloadStats(doctorId)
  }

  // New Analytics Endpoints

  @Get('analytics/custom-medication-stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetCustomMedicationStats()
  async getCustomMedicationStats() {
    return this.patientTreatmentService.getCustomMedicationStats()
  }

  @Get('analytics/protocol-comparison/:protocolId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiCompareProtocolVsCustomTreatments()
  async compareProtocolVsCustomTreatments(@Param('protocolId', ParseIntPipe) protocolId: number) {
    return this.patientTreatmentService.compareProtocolVsCustomTreatments(protocolId)
  }

  @Get('analytics/compliance/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetTreatmentComplianceStats()
  async getTreatmentComplianceStats(@Param('patientId', ParseIntPipe) patientId: number, @CurrentUser() user: any) {
    // If user is a patient, they can only see their own compliance stats
    if (user.role?.name === 'PATIENT' && Number(user.id) !== patientId) {
      throw new ForbiddenException('Patients can only access their own compliance statistics')
    }
    return this.patientTreatmentService.getTreatmentComplianceStats(patientId)
  }

  @Get('analytics/cost-analysis')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentCostAnalysis()
  async getTreatmentCostAnalysis(@Query() query: PatientTreatmentQueryDto) {
    const params = {
      patientId: query.patientId,
      doctorId: query.doctorId,
      protocolId: query.protocolId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    }
    return this.patientTreatmentService.getTreatmentCostAnalysis(params)
  }

  // Move the :id route to the end to avoid conflicts
  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentById()
  async getPatientTreatmentById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<PatientTreatment> {
    const treatment = await this.patientTreatmentService.getPatientTreatmentById(id)

    // If user is a patient, they can only see their own treatments
    if (user.role?.name === 'PATIENT' && treatment.patientId !== Number(user.id)) {
      throw new ForbiddenException('Patients can only access their own treatment records')
    }

    return treatment
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdatePatientTreatment()
  async updatePatientTreatment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ): Promise<PatientTreatment> {
    const validatedData = UpdatePatientTreatmentDto.create(body)
    return this.patientTreatmentService.updatePatientTreatment(id, validatedData)
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiDeletePatientTreatment()
  async deletePatientTreatment(@Param('id', ParseIntPipe) id: number): Promise<PatientTreatment> {
    return this.patientTreatmentService.deletePatientTreatment(id)
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.Doctor)
  @ApiBulkCreatePatientTreatments()
  async bulkCreatePatientTreatments(
    @Body() data: BulkCreatePatientTreatmentDto,
    @CurrentUser() user: any,
  ): Promise<PatientTreatment[]> {
    // Use consistent user ID property
    return this.patientTreatmentService.bulkCreatePatientTreatments(data, Number(user.id))
  }

  @Put('end-active/:patientId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiEndActivePatientTreatments()
  async endActivePatientTreatments(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
  ): Promise<{
    success: boolean
    message: string
    deactivatedCount: number
    endDate: string
    activeTreatments: PatientTreatment[]
  }> {
    const result = await this.patientTreatmentService.endActivePatientTreatments(patientId)

    // Log the action for audit purposes
    if (result.success && result.deactivatedCount > 0) {
      console.log(
        `User ${user.id || user.userId} ended ${result.deactivatedCount} active treatment(s) for patient ${patientId}`,
      )
    }

    return {
      success: result.success,
      message: result.message,
      deactivatedCount: result.deactivatedCount,
      endDate: result.endDate.toISOString(),
      activeTreatments: result.activeTreatments,
    }
  }

  @Get('validate-single-protocol/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Validate single protocol rule for a patient',
    description:
      'Checks if patient complies with business rule: 1 patient = 1 active protocol at any given time. Returns validation status and current treatments.',
  })
  async validateSingleProtocolRule(@Param('patientId', ParseIntPipe) patientId: number): Promise<{
    isValid: boolean
    errors: string[]
    currentTreatments: any[]
    message: string
  }> {
    try {
      const result = await this.patientTreatmentService.validateSingleProtocolRule(patientId)
      return {
        ...result,
        message: result.isValid
          ? 'Patient complies with single protocol rule'
          : 'Patient violates single protocol rule - multiple treatments active at same time',
      }
    } catch (error) {
      throw new Error(`Failed to validate single protocol rule: ${error.message}`)
    }
  }

  @Get('audit/business-rule-violations')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Detect business rule violations',
    description:
      'Audits all patients to find those with multiple active treatments, which violates the 1-patient-1-protocol rule.',
  })
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
    return await this.patientTreatmentService.detectBusinessRuleViolations()
  }

  @Post('audit/fix-business-rule-violations')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Fix business rule violations',
    description:
      'Automatically fixes business rule violations by ending older treatments. Use dryRun=true to preview actions.',
  })
  async fixBusinessRuleViolations(@Query('dryRun') dryRun?: string): Promise<{
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
    const isDryRun = dryRun !== 'false' // Default to true for safety
    return await this.patientTreatmentService.fixBusinessRuleViolations(isDryRun)
  }

  @Get('test/business-rule-compliance/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Test comprehensive business rule compliance for a patient',
    description:
      'Runs a full suite of tests to validate business rule compliance for a specific patient, including edge cases and data integrity checks.',
  })
  async testBusinessRuleCompliance(@Param('patientId', ParseIntPipe) patientId: number): Promise<{
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
    return await this.patientTreatmentService.testBusinessRuleCompliance(patientId)
  }

  @Get('validation/viral-load-monitoring/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Validate viral load monitoring compliance for a patient',
    description: 'Check if patient viral load monitoring is up to date and get recommendations',
  })
  validateViralLoadMonitoring(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query('treatmentStartDate') treatmentStartDate?: string,
  ): Promise<{
    isCompliant: boolean
    lastViralLoad: Date | null
    daysSinceLastTest: number | null
    requiredTestFrequency: 'monthly' | 'quarterly' | 'biannually'
    nextTestDue: Date
    urgencyLevel: 'normal' | 'due' | 'overdue' | 'critical'
    recommendations: string[]
  }> {
    const startDate = treatmentStartDate ? new Date(treatmentStartDate) : new Date()
    return Promise.resolve(this.patientTreatmentService.validateViralLoadMonitoring(patientId, startDate))
  }

  @Post('validation/adherence')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Validate treatment adherence and get recommendations',
    description: 'Analyze patient adherence data and provide intervention recommendations',
  })
  validateTreatmentAdherence(
    @Body() adherenceData: { pillsMissed: number; totalPills: number; recentAdherencePattern: number[] },
  ): Promise<{
    adherencePercentage: number
    adherenceLevel: 'excellent' | 'good' | 'suboptimal' | 'poor'
    riskAssessment: 'low' | 'medium' | 'high' | 'critical'
    interventionsRequired: string[]
    recommendations: string[]
  }> {
    return Promise.resolve(this.patientTreatmentService.validateTreatmentAdherence(adherenceData))
  }

  @Post('validation/pregnancy-safety')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Validate pregnancy safety for HIV treatment protocol',
    description: 'Check medication safety during pregnancy and breastfeeding',
  })
  validatePregnancySafety(
    @Body()
    safetyData: {
      patientGender: 'male' | 'female' | 'other'
      isPregnant: boolean
      isBreastfeeding: boolean
      protocolId: number
    },
  ): Promise<{
    isSafe: boolean
    pregnancyCategory: 'A' | 'B' | 'C' | 'D' | 'X' | 'N/A'
    contraindicatedMedications: string[]
    alternativeRecommendations: string[]
    monitoringRequirements: string[]
  }> {
    return Promise.resolve(
      this.patientTreatmentService.validatePregnancySafety(
        safetyData.patientGender,
        safetyData.isPregnant,
        safetyData.isBreastfeeding,
        safetyData.protocolId,
      ),
    )
  }

  @Post('validation/organ-function')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Validate organ function for HIV treatment dosing',
    description: 'Check liver and kidney function for proper medication dosing',
  })
  validateOrganFunction(
    @Body()
    organData: {
      liverFunction: { alt: number; ast: number; bilirubin: number }
      kidneyFunction: { creatinine: number; egfr: number }
      protocolId: number
    },
  ): Promise<{
    liverStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment'
    kidneyStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment'
    doseAdjustmentsRequired: string[]
    contraindicatedMedications: string[]
    monitoringRequirements: string[]
  }> {
    return Promise.resolve(
      this.patientTreatmentService.validateOrganFunction(
        organData.liverFunction,
        organData.kidneyFunction,
        organData.protocolId,
      ),
    )
  }

  @Post('validation/resistance-pattern')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Validate HIV resistance pattern for treatment effectiveness',
    description: 'Analyze resistance mutations and recommend appropriate treatments',
  })
  validateResistancePattern(
    @Body()
    resistanceData: {
      mutations: string[]
      resistanceLevel: 'none' | 'low' | 'intermediate' | 'high'
      previousFailedRegimens: string[]
      proposedProtocolId: number
    },
  ): Promise<{
    isEffective: boolean
    effectivenessScore: number
    resistantMedications: string[]
    recommendedAlternatives: string[]
    requiresGenotyping: boolean
  }> {
    return Promise.resolve(
      this.patientTreatmentService.validateResistancePattern(
        {
          mutations: resistanceData.mutations,
          resistanceLevel: resistanceData.resistanceLevel,
          previousFailedRegimens: resistanceData.previousFailedRegimens,
        },
        resistanceData.proposedProtocolId,
      ),
    )
  }

  @Post('validation/emergency-protocol')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Validate emergency treatment protocols (PEP/PrEP)',
    description: 'Validate timing and recommendations for post-exposure or pre-exposure prophylaxis',
  })
  validateEmergencyProtocol(
    @Body()
    emergencyData: {
      treatmentType: 'pep' | 'prep' | 'standard'
      exposureDate?: string
      riskFactors?: string[]
    },
  ): Promise<{
    isValidTiming: boolean
    timeWindow: string
    urgencyLevel: 'routine' | 'urgent' | 'emergency'
    protocolRecommendations: string[]
    followUpRequirements: string[]
  }> {
    const exposureDate = emergencyData.exposureDate ? new Date(emergencyData.exposureDate) : undefined
    return Promise.resolve(
      this.patientTreatmentService.validateEmergencyProtocol(
        emergencyData.treatmentType,
        exposureDate,
        emergencyData.riskFactors,
      ),
    )
  }

  @Get('validation/comprehensive/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Run comprehensive validation for all business rules',
    description: 'Execute all validation checks for a patient and provide consolidated recommendations',
  })
  async runComprehensiveValidation(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query('protocolId', ParseIntPipe) protocolId?: number,
  ): Promise<{
    patientId: number
    protocolId?: number
    validationResults: {
      viralLoadMonitoring: any
      treatmentContinuity: any
      doctorAuthorization: any
      businessRuleCompliance: any
    }
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical'
    priorityActions: string[]
    recommendations: string[]
  }> {
    // Get active treatment for the patient
    const activeTreatments = await this.patientTreatmentService.getActivePatientTreatments({
      patientId,
    })

    if (activeTreatments.data.length === 0) {
      throw new ForbiddenException('No active treatments found for this patient')
    }

    const treatment = activeTreatments.data[0]
    const treatmentProtocolId = protocolId || treatment.protocolId
    const treatmentDoctorId = treatment.doctorId

    // Run all validations
    const viralLoadMonitoring = this.patientTreatmentService.validateViralLoadMonitoring(patientId, treatment.startDate)

    const treatmentContinuity = await this.patientTreatmentService.validateTreatmentContinuity(
      patientId,
      treatment.startDate,
    )

    const doctorAuthorization = await this.patientTreatmentService.validateDoctorProtocolAuthorization(
      treatmentDoctorId,
      treatmentProtocolId,
    )

    const businessRuleCompliance = await this.patientTreatmentService.testBusinessRuleCompliance(patientId)

    // Assess overall risk level
    let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    const priorityActions: string[] = []
    const recommendations: string[] = []

    if (viralLoadMonitoring.urgencyLevel === 'critical' || treatmentContinuity.riskLevel === 'critical') {
      overallRiskLevel = 'critical'
      priorityActions.push('Immediate clinical intervention required')
    } else if (
      viralLoadMonitoring.urgencyLevel === 'overdue' ||
      treatmentContinuity.riskLevel === 'high' ||
      !doctorAuthorization.isAuthorized
    ) {
      overallRiskLevel = 'high'
      priorityActions.push('Urgent clinical review required')
    } else if (businessRuleCompliance.overallStatus === 'violation') {
      overallRiskLevel = 'medium'
      priorityActions.push('Address business rule violations')
    }

    // Consolidate recommendations
    if (viralLoadMonitoring.recommendations) {
      recommendations.push(...viralLoadMonitoring.recommendations)
    }
    if (treatmentContinuity.recommendations) {
      recommendations.push(...treatmentContinuity.recommendations)
    }
    if (doctorAuthorization.requirements) {
      recommendations.push(...doctorAuthorization.requirements)
    }

    return {
      patientId,
      protocolId: treatmentProtocolId,
      validationResults: {
        viralLoadMonitoring,
        treatmentContinuity,
        doctorAuthorization,
        businessRuleCompliance,
      },
      overallRiskLevel,
      priorityActions,
      recommendations: [...new Set(recommendations)], // Remove duplicates
    }
  }

  @Get('business-rules/status')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Get business rules implementation status',
    description: 'Returns information about all implemented business rules and available validation endpoints',
  })
  getBusinessRulesStatus(): {
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
    return this.patientTreatmentService.getBusinessRulesImplementationStatus()
  }

  @Get('business-rules/quick-check/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Quick business rules check for a patient',
    description: 'Performs a quick validation check without detailed analysis',
  })
  async quickBusinessRulesCheck(@Param('patientId', ParseIntPipe) patientId: number): Promise<{
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
    return await this.patientTreatmentService.quickBusinessRulesCheck(patientId)
  }

  @Post('calculate-cost')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Calculate treatment cost preview',
    description: 'Calculate estimated cost for a treatment before creating it. Useful for cost preview in frontend.',
  })
  calculateTreatmentCost(
    @Body()
    costData: {
      protocolId: number
      customMedications?: any
      startDate: string
      endDate?: string
    },
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
    const startDate = new Date(costData.startDate)
    const endDate = costData.endDate ? new Date(costData.endDate) : undefined

    return this.patientTreatmentService.calculateTreatmentCost(
      costData.protocolId,
      costData.customMedications,
      startDate,
      endDate,
    )
  }

  @Get('analytics/general-stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Get general treatment statistics',
    description: 'Comprehensive overview statistics for all treatments including trends and top protocols.',
  })
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
    return await this.patientTreatmentService.getGeneralTreatmentStats()
  }
}
