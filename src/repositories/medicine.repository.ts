/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common'
import { Medicine } from '@prisma/client'
import { PrismaService } from '../shared/services/prisma.service'
import { BaseRepository } from './base.repository'

// Types for Medicine
interface CreateMedicineData {
  name: string
  description?: string
  unit: string
  dose: string
  price: number
}

interface UpdateMedicineData {
  name?: string
  description?: string
  unit?: string
  dose?: string
  price?: number
}

interface MedicineFilters {
  name?: string
  unit?: string
  priceMin?: number
  priceMax?: number
}

@Injectable()
export class MedicineRepository extends BaseRepository<Medicine, CreateMedicineData, UpdateMedicineData> {
  protected model = this.prisma.medicine
  protected searchFields = ['name', 'description', 'unit']

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  /**
   * Find medicines with price filtering
   */
  async findWithPriceRange(minPrice?: number, maxPrice?: number): Promise<Medicine[]> {
    const where: any = {}

    if (minPrice !== undefined) {
      where.price = { ...where.price, gte: minPrice }
    }

    if (maxPrice !== undefined) {
      where.price = { ...where.price, lte: maxPrice }
    }

    return await this.findMany(where)
  }

  /**
   * Search medicines by name or description
   */
  async searchByNameOrDescription(searchTerm: string): Promise<Medicine[]> {
    return await this.findMany({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    })
  }

  /**
   * Find medicines by unit type
   */
  async findByUnit(unit: string): Promise<Medicine[]> {
    return await this.findMany({ unit })
  }

  /**
   * Get medicines with pagination and advanced filtering
   */
  async findWithAdvancedFiltering(options: any, filters: MedicineFilters = {}) {
    const additionalWhere: any = {}

    // Price range filtering
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      additionalWhere.price = {}
      if (filters.priceMin !== undefined) {
        additionalWhere.price.gte = filters.priceMin
      }
      if (filters.priceMax !== undefined) {
        additionalWhere.price.lte = filters.priceMax
      }
    }

    // Unit filtering
    if (filters.unit) {
      additionalWhere.unit = { contains: filters.unit, mode: 'insensitive' }
    }

    // Name filtering (in addition to search)
    if (filters.name) {
      additionalWhere.name = { contains: filters.name, mode: 'insensitive' }
    }

    return await this.findWithPagination(options, additionalWhere)
  }

  /**
   * Get medicine usage statistics (how many protocols use this medicine)
   */
  async getMedicineUsageStats(medicineId: number) {
    const medicine = await this.model.findUnique({
      where: { id: medicineId },
      include: {
        protocols: {
          include: {
            protocol: {
              select: {
                id: true,
                name: true,
                targetDisease: true,
              },
            },
          },
        },
      },
    })

    if (!medicine) return null

    return {
      medicine: {
        id: medicine.id,
        name: medicine.name,
        description: medicine.description,
        unit: medicine.unit,
        dose: medicine.dose,
        price: medicine.price,
      },
      usageCount: medicine.protocols.length,
      usedInProtocols: medicine.protocols.map((p) => ({
        protocolId: p.protocol.id,
        protocolName: p.protocol.name,
        targetDisease: p.protocol.targetDisease,
        dosage: p.dosage,
        duration: p.duration,
      })),
    }
  }

  /**
   * Get most frequently used medicines
   */
  async getMostUsedMedicines(limit = 10) {
    return await this.executeRaw(
      `
      SELECT 
        m.*,
        COUNT(pm.id) as usage_count
      FROM "Medicine" m
      LEFT JOIN "ProtocolMedicine" pm ON m.id = pm."medicineId"
      GROUP BY m.id
      ORDER BY usage_count DESC
      LIMIT $1
    `,
      [limit],
    )
  }

  /**
   * Bulk update medicine prices
   */
  async bulkUpdatePrices(updates: { id: number; price: number }[], userId: number) {
    return await this.transaction(async (tx) => {
      const results: Medicine[] = []
      for (const update of updates) {
        const result = await tx.medicine.update({
          where: { id: update.id },
          data: { price: update.price },
        })
        results.push(result)
      }
      return results
    })
  }
}
