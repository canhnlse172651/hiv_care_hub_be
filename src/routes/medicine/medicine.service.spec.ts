import { MedicineService } from './medicine.service'

describe('MedicineService Analytics', () => {
  let service: MedicineService

  beforeEach(() => {
    service = new MedicineService(
      // Mock repository and dependencies as needed
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'A', price: 100 },
            { id: 2, name: 'B', price: 200 },
            { id: 3, name: 'C', price: 300 },
          ],
        }),
      } as any,
      {} as any,
      {} as any,
    )
  })

  it('should return correct medicine usage stats', async () => {
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(3)
    expect(stats.totalCost).toBe(600)
    expect(stats.averageCost).toBeCloseTo(200)
    expect(stats.topUsedMedicines.length).toBeLessThanOrEqual(3)
  })
})
