import { Injectable } from '@nestjs/common'

@Injectable()
export class TreatmentProtocolAnalyticsService {
  /**
   * Calculate analytics for treatment protocols (top used, cost, usage rate, ...)
   * This is a sample, you can expand with real logic and DB queries.
   */
  getTopProtocols(protocols: Array<{ id: number; name: string }>): Array<{
    protocolId: number
    protocolName: string
    usageCount: number
  }> {
    // Fake usage count for demo (replace with real logic)
    return protocols
      .map((p) => ({ protocolId: p.id, protocolName: p.name, usageCount: Math.floor(Math.random() * 100) }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
  }

  getCostAnalysis(protocols: Array<{ id: number }>): { totalCost: number; averageCost: number } {
    // For demo, use 1000 per protocol
    const totalCost = protocols.length * 1000
    const averageCost = protocols.length > 0 ? totalCost / protocols.length : 0
    return {
      totalCost: Math.round(totalCost * 100) / 100,
      averageCost: Math.round(averageCost * 100) / 100,
    }
  }
}
