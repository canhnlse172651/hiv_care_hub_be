import { Injectable, BadRequestException, InternalServerErrorException, ConflictException } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'

@Injectable()
export class PatientTreatmentValidationService {
  constructor(private readonly patientTreatmentRepository: PatientTreatmentRepository) {}

  // Validate single protocol rule
  async validateSingleProtocolRule(patientId: number): Promise<{
    isValid: boolean
    errors: string[]
    currentTreatments: any[]
  }> {
    try {
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })

      const isValid = activeTreatments.length <= 1
      const errors: string[] = []

      if (!isValid) {
        errors.push(`Patient has ${activeTreatments.length} active treatments, should have maximum 1`)

        // Group by protocol to identify conflicts
        const protocolCounts = activeTreatments.reduce(
          (acc, treatment) => {
            acc[treatment.protocolId] = (acc[treatment.protocolId] || 0) + 1
            return acc
          },
          {} as Record<number, number>,
        )

        Object.entries(protocolCounts).forEach(([protocolId, count]) => {
          if (count > 1) {
            errors.push(`Multiple treatments (${count}) found for protocol ${protocolId}`)
          }
        })
      }

      return {
        isValid,
        errors,
        currentTreatments: activeTreatments,
      }
    } catch (error) {
      throw new InternalServerErrorException('Error validating single protocol rule')
    }
  }

  // Validate viral load monitoring (mock implementation)
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
    // Mock implementation
    const today = new Date()
    const treatmentDuration = today.getTime() - treatmentStartDate.getTime()
    const daysOnTreatment = Math.floor(treatmentDuration / (1000 * 60 * 60 * 24))

    // Determine frequency based on treatment duration
    let frequency: 'monthly' | 'quarterly' | 'biannually' = 'quarterly'
    if (daysOnTreatment < 180) frequency = 'monthly'
    else if (daysOnTreatment < 365) frequency = 'quarterly'
    else frequency = 'biannually'

    // Mock last test date (60 days ago)
    const lastViralLoad = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
    const daysSinceLastTest = 60

    // Calculate next test due
    const frequencyDays = frequency === 'monthly' ? 30 : frequency === 'quarterly' ? 90 : 180
    const nextTestDue = new Date(lastViralLoad.getTime() + frequencyDays * 24 * 60 * 60 * 1000)

    // Determine urgency
    let urgencyLevel: 'normal' | 'due' | 'overdue' | 'critical' = 'normal'
    const daysOverdue = Math.floor((today.getTime() - nextTestDue.getTime()) / (1000 * 60 * 60 * 24))

    if (daysOverdue > 30) urgencyLevel = 'critical'
    else if (daysOverdue > 7) urgencyLevel = 'overdue'
    else if (daysOverdue >= 0) urgencyLevel = 'due'

    const isCompliant = urgencyLevel === 'normal'

    const recommendations: string[] = []
    if (!isCompliant) {
      recommendations.push('Schedule viral load test immediately')
      if (urgencyLevel === 'critical') {
        recommendations.push('Consider treatment review due to overdue monitoring')
      }
    }

    return {
      isCompliant,
      lastViralLoad,
      daysSinceLastTest,
      requiredTestFrequency: frequency,
      nextTestDue,
      urgencyLevel,
      recommendations,
    }
  }

  // Validate treatment adherence (mock implementation)
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
    const adherencePercentage =
      ((adherenceData.totalPills - adherenceData.pillsMissed) / adherenceData.totalPills) * 100

    let adherenceLevel: 'excellent' | 'good' | 'suboptimal' | 'poor'
    let riskAssessment: 'low' | 'medium' | 'high' | 'critical'

    if (adherencePercentage >= 95) {
      adherenceLevel = 'excellent'
      riskAssessment = 'low'
    } else if (adherencePercentage >= 85) {
      adherenceLevel = 'good'
      riskAssessment = 'low'
    } else if (adherencePercentage >= 70) {
      adherenceLevel = 'suboptimal'
      riskAssessment = 'medium'
    } else {
      adherenceLevel = 'poor'
      riskAssessment = 'high'
    }

    const interventionsRequired: string[] = []
    const recommendations: string[] = []

    if (adherencePercentage < 95) {
      interventionsRequired.push('Adherence counseling')
      recommendations.push('Review dosing schedule with patient')
    }

    if (adherencePercentage < 70) {
      interventionsRequired.push('Intensive adherence support')
      recommendations.push('Consider simplified regimen')
      recommendations.push('Assess for side effects')
    }

    return {
      adherencePercentage,
      adherenceLevel,
      riskAssessment,
      interventionsRequired,
      recommendations,
    }
  }

  // Validate pregnancy safety (mock implementation)
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
    // Mock implementation
    if (patientGender === 'male') {
      return {
        isSafe: true,
        pregnancyCategory: 'N/A',
        contraindicatedMedications: [],
        alternativeRecommendations: [],
        monitoringRequirements: [],
      }
    }

    const isSafe = !isPregnant && !isBreastfeeding
    const pregnancyCategory = isPregnant ? 'B' : 'N/A'

    const contraindicatedMedications = isPregnant ? ['Efavirenz (if first trimester)'] : []
    const alternativeRecommendations = isPregnant ? ['Consider integrase inhibitor-based regimen'] : []
    const monitoringRequirements = isPregnant ? ['Monthly viral load monitoring', 'Fetal monitoring'] : []

    return {
      isSafe,
      pregnancyCategory,
      contraindicatedMedications,
      alternativeRecommendations,
      monitoringRequirements,
    }
  }

  // Validate organ function (mock implementation)
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
    // Assess liver function
    let liverStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment'
    if (liverFunction.alt > 200 || liverFunction.ast > 200) {
      liverStatus = 'severe-impairment'
    } else if (liverFunction.alt > 100 || liverFunction.ast > 100) {
      liverStatus = 'moderate-impairment'
    } else if (liverFunction.alt > 50 || liverFunction.ast > 50) {
      liverStatus = 'mild-impairment'
    } else {
      liverStatus = 'normal'
    }

    // Assess kidney function
    let kidneyStatus: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment'
    if (kidneyFunction.egfr < 30) {
      kidneyStatus = 'severe-impairment'
    } else if (kidneyFunction.egfr < 60) {
      kidneyStatus = 'moderate-impairment'
    } else if (kidneyFunction.egfr < 90) {
      kidneyStatus = 'mild-impairment'
    } else {
      kidneyStatus = 'normal'
    }

    const doseAdjustmentsRequired: string[] = []
    const contraindicatedMedications: string[] = []
    const monitoringRequirements: string[] = []

    if (liverStatus !== 'normal') {
      doseAdjustmentsRequired.push('Consider dose reduction for hepatically metabolized drugs')
      monitoringRequirements.push('Weekly liver function monitoring')
    }

    if (kidneyStatus !== 'normal') {
      doseAdjustmentsRequired.push('Adjust dose for renally eliminated drugs')
      monitoringRequirements.push('Regular creatinine monitoring')
    }

    if (kidneyStatus === 'severe-impairment') {
      contraindicatedMedications.push('Tenofovir DF')
    }

    return {
      liverStatus,
      kidneyStatus,
      doseAdjustmentsRequired,
      contraindicatedMedications,
      monitoringRequirements,
    }
  }

  // Validate resistance pattern (mock implementation)
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
    const effectivenessScore =
      resistanceData.resistanceLevel === 'none'
        ? 100
        : resistanceData.resistanceLevel === 'low'
          ? 80
          : resistanceData.resistanceLevel === 'intermediate'
            ? 60
            : 40

    const isEffective = effectivenessScore > 70
    const resistantMedications = resistanceData.mutations.includes('M184V') ? ['Lamivudine', 'Emtricitabine'] : []
    const recommendedAlternatives = !isEffective ? ['Consider boosted PI-based regimen'] : []
    const requiresGenotyping =
      resistanceData.resistanceLevel !== 'none' || resistanceData.previousFailedRegimens.length > 0

    return {
      isEffective,
      effectivenessScore,
      resistantMedications,
      recommendedAlternatives,
      requiresGenotyping,
    }
  }

  // Validate emergency protocol (mock implementation)
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
    if (treatmentType === 'pep' && exposureDate) {
      const hoursPostExposure = (new Date().getTime() - exposureDate.getTime()) / (1000 * 60 * 60)
      const isValidTiming = hoursPostExposure <= 72
      const urgencyLevel = hoursPostExposure <= 2 ? 'emergency' : hoursPostExposure <= 48 ? 'urgent' : 'routine'

      return {
        isValidTiming,
        timeWindow: `${Math.floor(hoursPostExposure)} hours post-exposure`,
        urgencyLevel,
        protocolRecommendations: isValidTiming ? ['Start TDF/FTC + RAL immediately'] : ['PEP window closed'],
        followUpRequirements: ['HIV test at 6 weeks, 3 months, 6 months'],
      }
    }

    return {
      isValidTiming: true,
      timeWindow: 'N/A',
      urgencyLevel: 'routine',
      protocolRecommendations: [],
      followUpRequirements: [],
    }
  }

  // Run comprehensive validation
  async runComprehensiveValidation(
    patientId: number,
    protocolId?: number,
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
      // Get active treatments for context
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })

      if (activeTreatments.length === 0) {
        throw new BadRequestException('No active treatments found for this patient')
      }

      const treatment = activeTreatments[0]

      // Run validations
      const viralLoadMonitoring = this.validateViralLoadMonitoring(patientId, treatment.startDate)
      const businessRuleCompliance = await this.validateSingleProtocolRule(patientId)

      // Mock other validations
      const treatmentContinuity = { isValid: true, gaps: [], recommendations: [] }
      const doctorAuthorization = { isAuthorized: true, requirements: [] }

      // Assess overall risk
      let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      const priorityActions: string[] = []
      const recommendations: string[] = []

      if (viralLoadMonitoring.urgencyLevel === 'critical') {
        overallRiskLevel = 'critical'
        priorityActions.push('Immediate viral load testing required')
      } else if (!businessRuleCompliance.isValid) {
        overallRiskLevel = 'high'
        priorityActions.push('Resolve multiple active treatments')
      }

      recommendations.push(...viralLoadMonitoring.recommendations)
      if (businessRuleCompliance.errors.length > 0) {
        recommendations.push('Address business rule violations')
      }

      return {
        patientId,
        protocolId,
        validationResults: {
          viralLoadMonitoring,
          treatmentContinuity,
          doctorAuthorization,
          businessRuleCompliance,
        },
        overallRiskLevel,
        priorityActions,
        recommendations: [...new Set(recommendations)],
      }
    } catch (error) {
      throw new InternalServerErrorException('Error running comprehensive validation')
    }
  }

  // Get business rules implementation status
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
      totalRules: 15,
      implementedRules: 8,
      mockRules: 7,
      availableEndpoints: [
        '/validation/single-protocol/:patientId',
        '/validation/viral-load-monitoring/:patientId',
        '/validation/adherence',
        '/validation/pregnancy-safety',
        '/validation/organ-function',
        '/validation/resistance-pattern',
        '/validation/emergency-protocol',
        '/validation/comprehensive/:patientId',
      ],
      summary: {
        coreRules: 3,
        clinicalRules: 4,
        safetyRules: 3,
        specializedRules: 5,
      },
    }
  }

  // Quick business rules check
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
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })

      const multipleActiveTreatments = activeTreatments.length > 1
      const futureDatesDetected = activeTreatments.some((t) => t.startDate > new Date())
      const invalidDateRanges = activeTreatments.some((t) => t.endDate && t.endDate < t.startDate)

      const violations = [multipleActiveTreatments, futureDatesDetected, invalidDateRanges].filter(Boolean)
      const hasActiveViolations = violations.length > 0

      let recommendation = 'No issues detected'
      if (hasActiveViolations) {
        recommendation = 'Business rule violations detected - review required'
      }

      return {
        patientId,
        hasActiveViolations,
        activeViolationsCount: violations.length,
        quickChecks: {
          multipleActiveTreatments,
          futureDatesDetected,
          invalidDateRanges,
        },
        recommendation,
      }
    } catch (error) {
      throw new InternalServerErrorException('Error in quick business rules check')
    }
  }
}
