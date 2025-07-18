export class ViralLoadMonitoringService {
  constructor(private readonly testResultRepository: any) {}

  public async validateViralLoadMonitoring(
    patientTreatmentId: number,
    treatmentStartDate: Date,
  ): Promise<{
    isCompliant: boolean
    lastViralLoad: Date | null
    daysSinceLastTest: number | null
    requiredTestFrequency: 'monthly' | 'quarterly' | 'biannually'
    nextTestDue: Date
    urgencyLevel: 'normal' | 'due' | 'overdue' | 'critical'
    recommendations: string[]
  }> {
    try {
      const now = new Date()
      const MS_PER_DAY = 1000 * 60 * 60 * 24
      const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY)

      // 1. Determine required test frequency based on treatment duration
      const daysSinceStart = daysBetween(now, treatmentStartDate)
      const requiredTestFrequency: 'monthly' | 'quarterly' | 'biannually' =
        daysSinceStart < 180 ? 'monthly' : daysSinceStart < 365 ? 'quarterly' : 'biannually'

      // 2. Get latest viral load test
      const lastTest = await this.testResultRepository.findLatestViralLoadTest(patientTreatmentId)
      const lastViralLoad: Date | null = lastTest?.resultDate ?? null
      const daysSinceLastTest: number | null = lastViralLoad ? daysBetween(now, lastViralLoad) : null

      // 3. Calculate next test due date
      const testIntervalDays =
        requiredTestFrequency === 'monthly' ? 30 : requiredTestFrequency === 'quarterly' ? 90 : 180
      const nextTestDue = lastViralLoad
        ? new Date(lastViralLoad.getTime() + testIntervalDays * MS_PER_DAY)
        : new Date(treatmentStartDate.getTime() + testIntervalDays * MS_PER_DAY)

      // 4. Assess urgency level
      const daysOverdue = daysBetween(now, nextTestDue)
      let urgencyLevel: 'normal' | 'due' | 'overdue' | 'critical' = 'normal'
      if (daysOverdue > 30) urgencyLevel = 'critical'
      else if (daysOverdue > 0) urgencyLevel = 'overdue'
      else if (daysOverdue > -7) urgencyLevel = 'due'

      // 5. Compliance and recommendations
      const isCompliant = urgencyLevel === 'normal'
      const recommendations: string[] = []
      if (!isCompliant) {
        recommendations.push(
          `Schedule viral load test immediately - ${Math.abs(daysOverdue)} days ${daysOverdue > 0 ? 'overdue' : 'until due'}`,
        )
      }
      if (requiredTestFrequency === 'monthly') {
        recommendations.push('Patient in initial treatment phase - requires monthly monitoring')
      }

      return {
        isCompliant,
        lastViralLoad,
        daysSinceLastTest,
        requiredTestFrequency,
        nextTestDue,
        urgencyLevel,
        recommendations,
      }
    } catch (error: any) {
      return {
        isCompliant: false,
        lastViralLoad: null,
        daysSinceLastTest: null,
        requiredTestFrequency: 'quarterly',
        nextTestDue: new Date(),
        urgencyLevel: 'critical',
        recommendations: [`Error validating viral load monitoring: ${error?.message || String(error)}`],
      }
    }
  }
}
