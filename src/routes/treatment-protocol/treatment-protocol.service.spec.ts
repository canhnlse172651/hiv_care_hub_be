import { TreatmentProtocolService } from './treatment-protocol.service'

describe('TreatmentProtocolService Analytics', () => {
  let service: TreatmentProtocolService

  beforeEach(() => {
    service = new TreatmentProtocolService(
      {
        getTreatmentProtocolModel: jest.fn().mockReturnValue({}),
      } as any,
      {
        paginate: jest.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'P1' },
            { id: 2, name: 'P2' },
          ],
        }),
      } as any,
      {} as any,
    )
  })

  it('should return correct protocol analytics', async () => {
    const stats = await service.getTreatmentProtocolAnalytics()
    expect(stats.totalProtocols).toBe(2)
    expect(stats.totalCost).toBe(2000)
    expect(stats.averageCost).toBeCloseTo(1000)
    expect(stats.topProtocols.length).toBeLessThanOrEqual(2)
  })
})
