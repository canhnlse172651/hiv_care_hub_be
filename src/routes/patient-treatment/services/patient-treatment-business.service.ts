import { Injectable } from '@nestjs/common'
import type { SharedErrorHandlingService } from 'src/shared/services/error-handling.service'
import { PatientTreatmentRepository } from '../../../repositories/patient-treatment.repository'
import { ENTITY_NAMES } from '../../../shared/constants/api.constants'

@Injectable()
export class PatientTreatmentBusinessService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly errorHandlingService: SharedErrorHandlingService,
  ) {}

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
      const allActiveTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({})
      // Group treatments by patientId
      const patientGroups = new Map<number, any[]>()
      for (const treatment of allActiveTreatments) {
        if (!patientGroups.has(treatment.patientId)) {
          patientGroups.set(treatment.patientId, [])
        }
        patientGroups.get(treatment.patientId)!.push(treatment)
      }
      // Detect violations: patients with >1 active treatment
      const violatingPatients = Array.from(patientGroups.entries())
        .filter(([_, treatments]) => treatments.length > 1)
        .map(([patientId, treatments]) => {
          const protocols = [...new Set(treatments.map((t: any) => t.protocolId as number))]
          return {
            patientId,
            activeTreatmentCount: treatments.length,
            treatments: treatments.map((t) => ({
              id: t.id,
              protocolId: t.protocolId,
              startDate: t.startDate.toISOString(),
              endDate: t.endDate ? t.endDate.toISOString() : null,
            })),
            protocols,
          }
        })
      return {
        totalViolations: violatingPatients.length,
        violatingPatients,
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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
          // Sort treatments: newest first
          const sortedTreatments = [...violation.treatments].sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
          )
          // End all but the newest
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
        } catch (error: any) {
          errors.push(`Failed to fix violations for patient ${violation.patientId}: ${error?.message || error}`)
        }
      }
      return {
        processedPatients: violations.violatingPatients.length,
        treatmentsEnded: isDryRun ? actions.length : treatmentsEnded,
        errors,
        actions,
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }
}
