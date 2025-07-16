import { Injectable } from '@nestjs/common'
import { PatientTreatmentRepository } from 'src/repositories/patient-treatment.repository'
import { SharedErrorHandlingService } from 'src/shared/services/error-handling.service'

@Injectable()
export class PatientTreatmentStatsService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly errorHandlingService: SharedErrorHandlingService,
  ) {}

  async getPatientTreatmentStats(patientId: number): Promise<{
    patientId: number
    totalTreatments: number
    activeTreatments: number
    completedTreatments: number
    totalCost: number
    averageCost: number
  }> {
    try {
      const validatedPatientId = this.errorHandlingService.validateId(patientId)
      const pid = typeof validatedPatientId === 'string' ? Number(validatedPatientId) : validatedPatientId
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(pid, {
        skip: 0,
        take: 1000,
      })
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({
        patientId: validatedPatientId,
      })
      const totalTreatments = allTreatments.length
      const activeTreatmentsCount = activeTreatments.length
      const completedTreatments = totalTreatments - activeTreatmentsCount
      const totalCost = allTreatments.reduce((sum, t) => sum + (t.total || 0), 0)
      return {
        patientId: Number(validatedPatientId),
        totalTreatments,
        activeTreatments: activeTreatmentsCount,
        completedTreatments,
        totalCost,
        averageCost: totalTreatments > 0 ? totalCost / totalTreatments : 0,
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, 'PATIENT_TREATMENT')
    }
  }

  async getDoctorWorkloadStats(doctorId: number): Promise<{
    doctorId: number
    totalTreatments: number
    activeTreatments: number
    uniquePatients: number
    averageTreatmentsPerPatient: number
  }> {
    try {
      const validatedDoctorId = this.errorHandlingService.validateId(doctorId)
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatmentsByDoctorId(validatedDoctorId, {
        skip: 0,
        take: 1000,
      })
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({})
      const doctorActiveTreatments = activeTreatments.filter((t) => t.doctorId === validatedDoctorId)
      const totalTreatments = allTreatments.length
      const activeTreatmentsCount = doctorActiveTreatments.length
      const uniquePatients = new Set(allTreatments.map((t) => t.patientId)).size
      return {
        doctorId: Number(validatedDoctorId),
        totalTreatments,
        activeTreatments: activeTreatmentsCount,
        uniquePatients,
        averageTreatmentsPerPatient: uniquePatients > 0 ? totalTreatments / uniquePatients : 0,
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, 'PATIENT_TREATMENT')
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
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatments({
        skip: 0,
        take: 10000,
      })
      const treatmentsWithCustomMeds = allTreatments.filter((t) => t.customMedications && t.customMedications !== null)
      const totalTreatments = allTreatments.length
      const treatmentsWithCustomMedsCount = treatmentsWithCustomMeds.length
      const customMedicationUsageRate =
        totalTreatments > 0 ? (treatmentsWithCustomMedsCount / totalTreatments) * 100 : 0
      const medicationUsage = new Map<string, number>()
      for (const treatment of treatmentsWithCustomMeds) {
        if (Array.isArray(treatment.customMedications)) {
          for (const med of treatment.customMedications) {
            if (med && typeof med === 'object' && 'name' in med && typeof (med as any).name === 'string') {
              const medName = (med as any).name as string
              const currentCount = medicationUsage.get(medName) || 0
              medicationUsage.set(medName, currentCount + 1)
            }
          }
        }
      }
      const topCustomMedicines = Array.from(medicationUsage.entries())
        .map(([name, count], index) => ({
          medicineId: index + 1000,
          medicineName: name,
          usageCount: count,
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
      return {
        totalTreatments,
        treatmentsWithCustomMeds: treatmentsWithCustomMedsCount,
        customMedicationUsageRate: Math.round(customMedicationUsageRate * 100) / 100,
        topCustomMedicines,
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, 'PATIENT_TREATMENT')
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
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatments({
        where: { protocolId: validatedProtocolId },
        skip: 0,
        take: 10000,
      })
      const standardTreatments = allTreatments.filter((t) => !t.customMedications || t.customMedications === null)
      const customTreatments = allTreatments.filter((t) => t.customMedications && t.customMedications !== null)
      const standardStats = this.calculateTreatmentStats(standardTreatments)
      const customStats = this.calculateTreatmentStats(customTreatments)
      const customizationRate = allTreatments.length > 0 ? (customTreatments.length / allTreatments.length) * 100 : 0
      return {
        protocol: { id: Number(validatedProtocolId) },
        standardTreatments: standardStats,
        customTreatments: customStats,
        customizationRate: Math.round(customizationRate * 100) / 100,
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, 'PATIENT_TREATMENT')
    }
  }

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
}
