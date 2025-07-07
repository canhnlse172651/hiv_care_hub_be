// Types for analytics endpoints

export interface TreatmentComplianceStatsDto {
  patientId: number
  adherence: number
  missedDoses: number
  riskLevel: string
  recommendations: string[]
}

export interface TreatmentCostAnalysisDto {
  totalCost: number
  breakdown: Record<string, number>
  warnings: string[]
}
