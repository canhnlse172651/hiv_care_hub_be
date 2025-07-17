export class TreatmentAdherenceService {
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
    try {
      const { pillsMissed, totalPills, recentAdherencePattern } = adherenceData
      if (
        typeof pillsMissed !== 'number' ||
        typeof totalPills !== 'number' ||
        totalPills < 0 ||
        pillsMissed < 0 ||
        !Array.isArray(recentAdherencePattern)
      ) {
        throw new Error(
          'Invalid adherence data: pillsMissed, totalPills must be non-negative numbers and recentAdherencePattern must be an array',
        )
      }
      const adherencePercentage = totalPills > 0 ? ((totalPills - pillsMissed) / totalPills) * 100 : 0
      let adherenceLevel: 'excellent' | 'good' | 'suboptimal' | 'poor'
      let riskAssessment: 'low' | 'medium' | 'high' | 'critical'
      if (adherencePercentage >= 95) {
        adherenceLevel = 'excellent'
        riskAssessment = 'low'
      } else if (adherencePercentage >= 85) {
        adherenceLevel = 'good'
        riskAssessment = 'medium'
      } else if (adherencePercentage >= 70) {
        adherenceLevel = 'suboptimal'
        riskAssessment = 'high'
      } else {
        adherenceLevel = 'poor'
        riskAssessment = 'critical'
      }
      const interventionsRequired: string[] = []
      const recommendations: string[] = []
      if (adherencePercentage < 95) {
        interventionsRequired.push('Adherence counseling required')
        recommendations.push('Schedule adherence counseling session')
      }
      if (adherencePercentage < 85) {
        interventionsRequired.push('Enhanced support measures')
        recommendations.push('Consider pill organizers, reminders, or directly observed therapy')
      }
      if (adherencePercentage < 70) {
        interventionsRequired.push('Urgent clinical review')
        recommendations.push('Immediate clinical assessment for treatment modification')
      }
      return {
        adherencePercentage: Math.round(adherencePercentage * 100) / 100,
        adherenceLevel,
        riskAssessment,
        interventionsRequired,
        recommendations,
      }
    } catch (error: any) {
      throw new Error(`Error validating treatment adherence: ${error?.message || String(error)}`)
    }
  }
}
