import { Injectable } from '@nestjs/common'
import { PatientTreatmentRepository } from 'src/repositories/patient-treatment.repository'
import { ENTITY_NAMES } from 'src/shared/constants/api.constants'
import { SharedErrorHandlingService } from 'src/shared/services/error-handling.service'

@Injectable()
export class PatientTreatmentStatsService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly errorHandlingService: SharedErrorHandlingService,
  ) {}

  /**
   * Thống kê tổng quan điều trị của bệnh nhân
   */
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
        page: 1,
        limit: 1000,
      })
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId: pid })
      const totalTreatments = allTreatments.length
      const activeTreatmentsCount = activeTreatments.length
      const completedTreatments = totalTreatments - activeTreatmentsCount
      const totalCost = allTreatments.reduce((sum, t) => sum + (t.total || 0), 0)
      return {
        patientId: pid,
        totalTreatments,
        activeTreatments: activeTreatmentsCount,
        completedTreatments,
        totalCost,
        averageCost: totalTreatments > 0 ? totalCost / totalTreatments : 0,
      }
    } catch (error) {
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Thống kê khối lượng công việc của bác sĩ
   */
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
        page: 1,
        limit: 1000,
      })
      const doctorActiveTreatments = (await this.patientTreatmentRepository.getActivePatientTreatments({})).filter(
        (t) => t.doctorId === validatedDoctorId,
      )
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
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
    }
  }

  /**
   * Thống kê sử dụng thuốc custom
   */
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
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatments({ page: 1, limit: 10000 })
      const treatmentsWithCustomMeds = allTreatments.filter((t) => t.customMedications && t.customMedications !== null)
      const totalTreatments = allTreatments.length
      const treatmentsWithCustomMedsCount = treatmentsWithCustomMeds.length
      const customMedicationUsageRate =
        totalTreatments > 0 ? (treatmentsWithCustomMedsCount / totalTreatments) * 100 : 0
      const medicationUsage = new Map<string, number>()
      treatmentsWithCustomMeds.forEach((treatment) => {
        if (Array.isArray(treatment.customMedications)) {
          treatment.customMedications.forEach((med) => {
            if (med && typeof med === 'object' && 'name' in med && typeof (med as any).name === 'string') {
              const medName = (med as any).name as string
              medicationUsage.set(medName, (medicationUsage.get(medName) || 0) + 1)
            }
          })
        }
      })
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
      throw this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.PATIENT_TREATMENT)
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
        page: 1,
        limit: 10000,
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
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatments({ page: 1, limit: 10000 })
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({})

      const totalTreatments = allTreatments.length
      const activeTreatmentsCount = activeTreatments.length
      const completedTreatments = totalTreatments - activeTreatmentsCount
      const totalPatients = new Set(allTreatments.map((t) => t.patientId)).size
      const totalCost = allTreatments.reduce((sum, t) => sum + (t.total || 0), 0)
      const averageCostPerTreatment = totalTreatments > 0 ? totalCost / totalTreatments : 0

      const completedWithDuration = allTreatments.filter((t) => t.endDate)
      let averageTreatmentDuration: number | null = null
      if (completedWithDuration.length > 0) {
        const totalDuration = completedWithDuration.reduce((sum, t) => {
          const start = new Date(t.startDate)
          const end = new Date(t.endDate!)
          return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        }, 0)
        averageTreatmentDuration = Math.round(totalDuration / completedWithDuration.length)
      }

      const protocolCounts = new Map<number, number>()
      allTreatments.forEach((t) => {
        if (typeof t.protocolId === 'number') {
          protocolCounts.set(t.protocolId, (protocolCounts.get(t.protocolId) || 0) + 1)
        }
      })
      const topProtocols = Array.from(protocolCounts.entries())
        .map(([protocolId, count]) => ({
          protocolId,
          count,
          percentage: totalTreatments > 0 ? Math.round((count / totalTreatments) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

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
        const monthKey = monthStart.toISOString().slice(0, 7)
        const newTreatments = allTreatments.filter((t) => {
          const startDate = t.startDate ? new Date(t.startDate) : null
          return startDate && startDate >= monthStart && startDate <= monthEnd
        })
        const completedTreatments = allTreatments.filter((t) => {
          if (!t.endDate) return false
          const endDate = new Date(t.endDate)
          return endDate >= monthStart && endDate <= monthEnd
        })
        const monthTotalCost = newTreatments.reduce((sum, t) => sum + (t.total || 0), 0)
        monthlyTrends.push({
          month: monthKey,
          newTreatments: newTreatments.length,
          completedTreatments: completedTreatments.length,
          totalCost: monthTotalCost,
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
}
