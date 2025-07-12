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

  it('should return zero stats when no medicines', async () => {
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({ data: [] }),
      } as any,
      {} as any,
      {} as any,
    )
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(0)
    expect(stats.totalCost).toBe(0)
    expect(stats.averageCost).toBe(0)
    expect(stats.topUsedMedicines.length).toBe(0)
  })

  it('should handle medicines with zero or negative price', async () => {
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'A', price: 0 },
            { id: 2, name: 'B', price: -100 },
            { id: 3, name: 'C', price: 200 },
          ],
        }),
      } as any,
      {} as any,
      {} as any,
    )
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(3)
    expect(stats.totalCost).toBe(200)
    expect(stats.averageCost).toBeCloseTo(200)
  })

  it('should handle duplicate medicine names', async () => {
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'A', price: 100 },
            { id: 2, name: 'A', price: 200 },
            { id: 3, name: 'B', price: 300 },
          ],
        }),
      } as any,
      {} as any,
      {} as any,
    )
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(3)
    expect(stats.totalCost).toBe(600)
    expect(stats.averageCost).toBeCloseTo(200)
    expect(stats.topUsedMedicines.some((med) => med.medicineName === 'A')).toBe(true)
  })

  it('should throw error if repository fails', async () => {
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockRejectedValue(new Error('DB error')),
      } as any,
      {} as any,
      {} as any,
    )
    await expect(service.getMedicineUsageStats()).rejects.toThrow('DB error')
  })

  it('should handle a large number of medicines', async () => {
    const medicines = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Med${i}`, price: i + 1 }))
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({ data: medicines }),
      } as any,
      {} as any,
      {} as any,
    )
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(1000)
    expect(stats.totalCost).toBe(500500)
    expect(stats.averageCost).toBeCloseTo(500.5)
  })

  it('should handle all medicines with the same price', async () => {
    const medicines = [
      { id: 1, name: 'A', price: 100 },
      { id: 2, name: 'B', price: 100 },
      { id: 3, name: 'C', price: 100 },
    ]
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({ data: medicines }),
      } as any,
      {} as any,
      {} as any,
    )
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(3)
    expect(stats.totalCost).toBe(300)
    expect(stats.averageCost).toBeCloseTo(100)
  })

  it('should skip medicines missing price field', async () => {
    const medicines = [
      { id: 1, name: 'A', price: 100 },
      { id: 2, name: 'B' },
      { id: 3, name: 'C', price: 200 },
    ] as any
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({ data: medicines }),
      } as any,
      {} as any,
      {} as any,
    )
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(3)
    expect(stats.totalCost).toBe(300)
    expect(stats.averageCost).toBeCloseTo(150)
  })

  it('should handle medicines with duplicate ids', async () => {
    const medicines = [
      { id: 1, name: 'A', price: 100 },
      { id: 1, name: 'A', price: 200 },
      { id: 2, name: 'B', price: 300 },
    ]
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({ data: medicines }),
      } as any,
      {} as any,
      {} as any,
    )
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(3)
    expect(stats.totalCost).toBe(600)
    expect(stats.averageCost).toBeCloseTo(200)
  })

  it('should handle medicines with null or undefined name', async () => {
    const medicines = [
      { id: 1, name: null, price: 100 },
      { id: 2, name: undefined, price: 200 },
      { id: 3, name: 'C', price: 300 },
    ]
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({ data: medicines }),
      } as any,
      {} as any,
      {} as any,
    )
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(3)
    expect(stats.totalCost).toBe(600)
    expect(stats.averageCost).toBeCloseTo(200)
  })

  it('should skip medicines with NaN or non-numeric price', async () => {
    const medicines = [
      { id: 1, name: 'A', price: NaN },
      { id: 2, name: 'B', price: 'abc' },
      { id: 3, name: 'C', price: 200 },
    ] as any
    service = new MedicineService(
      {
        findMedicinesPaginated: jest.fn().mockResolvedValue({ data: medicines }),
      } as any,
      {} as any,
      {} as any,
    )
    const stats = await service.getMedicineUsageStats()
    expect(stats.totalMedicines).toBe(3)
    expect(stats.totalCost).toBe(200)
    expect(stats.averageCost).toBeCloseTo(200)
  })
})
