import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthType } from '../../../../shared/constants/auth.constant'
import { Role } from '../../../../shared/constants/role.constant'
import { Auth } from '../../../../shared/decorators/auth.decorator'
import { Roles } from '../../../../shared/decorators/roles.decorator'
import { PatientTreatmentValidationService } from './patient-treatment-validation.service'

@ApiBearerAuth()
@ApiTags('Patient Treatment - Validation & Business Rules')
@Controller('patient-treatments/validation')
@Auth([AuthType.Bearer])
export class PatientTreatmentValidationController {
  constructor(private readonly patientTreatmentValidationService: PatientTreatmentValidationService) {}

  @Get('single-protocol/:patientId')
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
      const result = await this.patientTreatmentValidationService.validateSingleProtocolRule(patientId)
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

  @Get('viral-load-monitoring/:patientId')
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
    return Promise.resolve(this.patientTreatmentValidationService.validateViralLoadMonitoring(patientId, startDate))
  }

  @Post('adherence')
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
    return Promise.resolve(this.patientTreatmentValidationService.validateTreatmentAdherence(adherenceData))
  }

  @Post('pregnancy-safety')
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
      this.patientTreatmentValidationService.validatePregnancySafety(
        safetyData.patientGender,
        safetyData.isPregnant,
        safetyData.isBreastfeeding,
        safetyData.protocolId,
      ),
    )
  }

  @Post('organ-function')
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
      this.patientTreatmentValidationService.validateOrganFunction(
        organData.liverFunction,
        organData.kidneyFunction,
        organData.protocolId,
      ),
    )
  }

  @Post('resistance-pattern')
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
      this.patientTreatmentValidationService.validateResistancePattern(
        {
          mutations: resistanceData.mutations,
          resistanceLevel: resistanceData.resistanceLevel,
          previousFailedRegimens: resistanceData.previousFailedRegimens,
        },
        resistanceData.proposedProtocolId,
      ),
    )
  }

  @Post('emergency-protocol')
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
      this.patientTreatmentValidationService.validateEmergencyProtocol(
        emergencyData.treatmentType,
        exposureDate,
        emergencyData.riskFactors,
      ),
    )
  }

  @Get('comprehensive/:patientId')
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
    try {
      const result = await this.patientTreatmentValidationService.runComprehensiveValidation(patientId, protocolId)
      return result
    } catch (error) {
      throw new Error(`Comprehensive validation failed: ${error.message}`)
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
    return this.patientTreatmentValidationService.getBusinessRulesImplementationStatus()
  }

  @Get('quick-check/:patientId')
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
    return await this.patientTreatmentValidationService.quickBusinessRulesCheck(patientId)
  }
}
