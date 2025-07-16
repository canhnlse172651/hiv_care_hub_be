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

      // 1. Xác định tần suất test dựa vào thời gian điều trị
      const daysSinceStart = daysBetween(now, treatmentStartDate)
      let requiredTestFrequency: 'monthly' | 'quarterly' | 'biannually'
      if (daysSinceStart < 180) requiredTestFrequency = 'monthly'
      else if (daysSinceStart < 365) requiredTestFrequency = 'quarterly'
      else requiredTestFrequency = 'biannually'

      // 2. Lấy test viral load gần nhất
      const lastTest = await this.testResultRepository.findLatestViralLoadTest(patientTreatmentId)
      const lastViralLoad: Date | null = lastTest?.resultDate ?? null
      const daysSinceLastTest: number | null = lastViralLoad ? daysBetween(now, lastViralLoad) : null

      // 3. Tính ngày test tiếp theo cần thực hiện
      const testIntervalDays =
        requiredTestFrequency === 'monthly' ? 30 : requiredTestFrequency === 'quarterly' ? 90 : 180
      const nextTestDue = lastViralLoad
        ? new Date(lastViralLoad.getTime() + testIntervalDays * MS_PER_DAY)
        : new Date(treatmentStartDate.getTime() + testIntervalDays * MS_PER_DAY)

      // 4. Đánh giá mức độ khẩn cấp
      const daysOverdue = daysBetween(now, nextTestDue)
      let urgencyLevel: 'normal' | 'due' | 'overdue' | 'critical' = 'normal'
      if (daysOverdue > 30) urgencyLevel = 'critical'
      else if (daysOverdue > 0) urgencyLevel = 'overdue'
      else if (daysOverdue > -7) urgencyLevel = 'due'

      // 5. Đánh giá tuân thủ và khuyến nghị
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
    } catch (error) {
      return {
        isCompliant: false,
        lastViralLoad: null,
        daysSinceLastTest: null,
        requiredTestFrequency: 'quarterly',
        nextTestDue: new Date(),
        urgencyLevel: 'critical',
        recommendations: [`Error validating viral load monitoring: ${error.message}`],
      }
    }
  }
}
