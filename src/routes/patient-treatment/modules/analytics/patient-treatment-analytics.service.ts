import { Injectable, BadRequestException, InternalServerErrorException, ConflictException } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'

@Injectable()
export class PatientTreatmentAnalyticsService {
  constructor(private readonly patientTreatmentRepository: PatientTreatmentRepository) {}

  // Get patient treatment statistics
  async getPatientTreatmentStats(patientId: number): Promise<{
    totalTreatments: number
    activeTreatments: number
    completedTreatments: number
    totalCost: number
    averageCostPerTreatment: number
    protocols: number
    doctors: number
  }> {
    try {
      // Get all treatments for the patient
      const treatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(patientId, {
        skip: 0,
        take: 100,
      })

      const stats = {
        totalTreatments: treatments.length,
        activeTreatments: treatments.filter((t) => !t.endDate).length,
        completedTreatments: treatments.filter((t) => t.endDate).length,
        totalCost: treatments.reduce((sum, t) => sum + t.total, 0),
        averageCostPerTreatment:
          treatments.length > 0 ? treatments.reduce((sum, t) => sum + t.total, 0) / treatments.length : 0,
        protocols: [...new Set(treatments.map((t) => t.protocolId))].length,
        doctors: [...new Set(treatments.map((t) => t.doctorId))].length,
      }

      return stats
    } catch (error) {
      throw new InternalServerErrorException('Error getting patient treatment stats')
    }
  }

  // Get doctor workload statistics
  async getDoctorWorkloadStats(doctorId: number): Promise<{
    totalTreatments: number
    activeTreatments: number
    uniquePatients: number
    totalRevenue: number
    averageTreatmentValue: number
    protocols: number
  }> {
    try {
      const treatments = await this.patientTreatmentRepository.findPatientTreatmentsByDoctorId(doctorId, {
        skip: 0,
        take: 1000,
      })

      const stats = {
        totalTreatments: treatments.length,
        activeTreatments: treatments.filter((t) => !t.endDate).length,
        uniquePatients: [...new Set(treatments.map((t) => t.patientId))].length,
        totalRevenue: treatments.reduce((sum, t) => sum + t.total, 0),
        averageTreatmentValue:
          treatments.length > 0 ? treatments.reduce((sum, t) => sum + t.total, 0) / treatments.length : 0,
        protocols: [...new Set(treatments.map((t) => t.protocolId))].length,
      }

      return stats
    } catch (error) {
      throw new InternalServerErrorException('Error getting doctor workload stats')
    }
  }

  // Get custom medication statistics
  getCustomMedicationStats(): Promise<{
    totalTreatmentsWithCustomMeds: number
    percentage: number
    mostCommonCustomMeds: any[]
    averageCostIncrease: number
  }> {
    try {
      // This would need a more complex query to analyze custom medications
      // For now, return a mock response
      return Promise.resolve({
        totalTreatmentsWithCustomMeds: 0,
        percentage: 0,
        mostCommonCustomMeds: [],
        averageCostIncrease: 0,
      })
    } catch (error) {
      throw new InternalServerErrorException('Error getting custom medication stats')
    }
  }

  // Compare protocol vs custom treatments
  compareProtocolVsCustomTreatments(protocolId: number): Promise<{
    protocolId: number
    standardTreatments: number
    customizedTreatments: number
    averageCostDifference: number
    effectivenessComparison: Record<string, any>
  }> {
    try {
      // This would need more complex analysis
      // For now, return a mock response
      return Promise.resolve({
        protocolId,
        standardTreatments: 0,
        customizedTreatments: 0,
        averageCostDifference: 0,
        effectivenessComparison: {},
      })
    } catch (error) {
      throw new InternalServerErrorException('Error comparing protocol vs custom treatments')
    }
  }

  // Get treatment compliance statistics
  getTreatmentComplianceStats(patientId: number): Promise<{
    patientId: number
    averageCompliance: number
    completedTreatments: number
    missedAppointments: number
    adherenceScore: string
  }> {
    try {
      // Mock implementation - would need integration with actual compliance tracking
      return Promise.resolve({
        patientId,
        averageCompliance: 85,
        completedTreatments: 0,
        missedAppointments: 0,
        adherenceScore: 'Good',
      })
    } catch (error) {
      throw new InternalServerErrorException('Error getting treatment compliance stats')
    }
  }

  // Get treatment cost analysis
  async getTreatmentCostAnalysis(params: any): Promise<{
    totalTreatments: number
    totalCost: number
    averageCost: number
    costByProtocol: Record<string, any>
    costByDoctor: Record<string, any>
    costTrends: any[]
  }> {
    try {
      // Build filters based on params
      const where: any = {}
      if (params.patientId) where.patientId = params.patientId
      if (params.doctorId) where.doctorId = params.doctorId
      if (params.protocolId) where.protocolId = params.protocolId
      if (params.startDate || params.endDate) {
        where.startDate = {}
        if (params.startDate) where.startDate.gte = params.startDate
        if (params.endDate) where.startDate.lte = params.endDate
      }

      // Get treatments based on filters
      const treatments = await this.patientTreatmentRepository.findPatientTreatments({
        where,
        take: 1000,
      })

      const analysis = {
        totalTreatments: treatments.length,
        totalCost: treatments.reduce((sum, t) => sum + t.total, 0),
        averageCost: treatments.length > 0 ? treatments.reduce((sum, t) => sum + t.total, 0) / treatments.length : 0,
        costByProtocol: {},
        costByDoctor: {},
        costTrends: [],
      }

      return analysis
    } catch (error) {
      throw new InternalServerErrorException('Error getting treatment cost analysis')
    }
  }

  // Calculate treatment cost
  calculateTreatmentCost(
    protocolId: number,
    customMedications?: Record<string, any>,
    startDate?: Date,
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
    try {
      // Mock implementation - would need protocol pricing logic
      const baseCost = 1000 // Mock base cost
      const customMedCost = customMedications ? Object.keys(customMedications).length * 100 : 0

      let durationMultiplier = 1
      let durationInDays: number | null = null

      if (startDate && endDate) {
        durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        durationMultiplier = Math.max(1, durationInDays / 30) // Monthly rate
      }

      const calculatedTotal = (baseCost + customMedCost) * durationMultiplier

      return {
        isValid: true,
        calculatedTotal,
        breakdown: {
          protocolCost: baseCost,
          customMedicationCost: customMedCost,
          durationMultiplier,
          durationInDays,
        },
        warnings: [],
      }
    } catch (error) {
      return {
        isValid: false,
        calculatedTotal: 0,
        breakdown: {
          protocolCost: 0,
          customMedicationCost: 0,
          durationMultiplier: 1,
          durationInDays: null,
        },
        warnings: ['Error calculating cost'],
      }
    }
  }

  // Get general treatment statistics
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
      // Get all treatments for analysis
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatments({ take: 10000 })

      const totalTreatments = allTreatments.length
      const activeTreatments = allTreatments.filter((t) => !t.endDate).length
      const completedTreatments = allTreatments.filter((t) => t.endDate).length
      const totalPatients = [...new Set(allTreatments.map((t) => t.patientId))].length
      const totalCost = allTreatments.reduce((sum, t) => sum + t.total, 0)
      const averageCostPerTreatment = totalTreatments > 0 ? totalCost / totalTreatments : 0

      // Calculate average treatment duration
      const completedWithDuration = allTreatments.filter((t) => t.endDate)
      const averageTreatmentDuration =
        completedWithDuration.length > 0
          ? completedWithDuration.reduce((sum, t) => {
              const duration = t.endDate!.getTime() - t.startDate.getTime()
              return sum + duration / (1000 * 60 * 60 * 24) // Convert to days
            }, 0) / completedWithDuration.length
          : null

      // Top protocols by usage
      const protocolCounts = allTreatments.reduce(
        (acc, t) => {
          acc[t.protocolId] = (acc[t.protocolId] || 0) + 1
          return acc
        },
        {} as Record<number, number>,
      )

      const topProtocols = Object.entries(protocolCounts)
        .map(([protocolId, count]) => ({
          protocolId: Number(protocolId),
          count,
          percentage: (count / totalTreatments) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Monthly trends (simplified - would need more complex date grouping)
      const monthlyTrends = [
        {
          month: '2024-01',
          newTreatments: Math.floor(totalTreatments * 0.1),
          completedTreatments: Math.floor(completedTreatments * 0.1),
          totalCost: totalCost * 0.1,
        },
        // Add more months as needed
      ]

      return {
        totalTreatments,
        activeTreatments,
        completedTreatments,
        totalPatients,
        averageTreatmentDuration,
        totalCost,
        averageCostPerTreatment,
        topProtocols,
        monthlyTrends,
      }
    } catch (error) {
      throw new InternalServerErrorException('Error getting general treatment stats')
    }
  }
}
