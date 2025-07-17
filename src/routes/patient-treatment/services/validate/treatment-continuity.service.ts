import { Injectable } from '@nestjs/common'
import { PatientTreatmentRepository } from 'src/repositories/patient-treatment.repository'

@Injectable()
export class TreatmentContinuityService {
  constructor(private readonly patientTreatmentRepository: PatientTreatmentRepository) {}

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

      // Sort treatments by start date ascending
      const sortedTreatments = allTreatments
        .slice()
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

      // Find current treatment index
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
      const previousEndDate = previousTreatment.endDate ? new Date(previousTreatment.endDate) : null
      const gapDays = previousEndDate
        ? Math.floor((currentTreatmentStart.getTime() - previousEndDate.getTime()) / (1000 * 60 * 60 * 24))
        : null

      let isContinuous = true
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      const recommendations: string[] = []

      if (gapDays !== null && gapDays > 7) {
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
    } catch (error: any) {
      return {
        isContinuous: false,
        gapDays: null,
        riskLevel: 'critical',
        recommendations: ['Error validating treatment continuity - manual review required'],
      }
    }
  }
}
