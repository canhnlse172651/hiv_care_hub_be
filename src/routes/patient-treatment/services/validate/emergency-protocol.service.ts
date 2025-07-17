import { Injectable } from '@nestjs/common'
import { PatientTreatmentRepository } from 'src/repositories/patient-treatment.repository'

@Injectable()
export class EmergencyProtocolService {
  constructor(private readonly patientTreatmentRepository: PatientTreatmentRepository) {}

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

    if (treatmentType === 'pep' && exposureDate instanceof Date) {
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

    // Standard treatment recommendations
    if (treatmentType === 'standard') {
      protocolRecommendations.push('Follow standard HIV treatment guidelines')
      followUpRequirements.push('Routine clinical follow-up as per protocol')
    }

    return {
      isValidTiming,
      timeWindow,
      urgencyLevel,
      protocolRecommendations,
      followUpRequirements,
    }
  }
}
