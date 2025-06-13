import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { TreatmentProtocol } from '@prisma/client'
import { TreatmentProtocolRepository } from '../../repositories/treatment-protocol.repository'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { PaginationService } from '../../shared/services/pagination.service'
import { CreateTreatmentProtocol, UpdateTreatmentProtocol } from './treatment-protocol.model'

@Injectable()
export class TreatmentProtocolService {
  constructor(
    private readonly treatmentProtocolRepository: TreatmentProtocolRepository,
    private readonly paginationService: PaginationService,
  ) {}

  // Create new treatment protocol
  async createTreatmentProtocol(data: CreateTreatmentProtocol, userId: number): Promise<TreatmentProtocol> {
    // Check if protocol with same name already exists
    const existingProtocol = await this.treatmentProtocolRepository.findTreatmentProtocolByName(data.name)
    if (existingProtocol) {
      throw new ConflictException('Treatment protocol with this name already exists')
    }

    return this.treatmentProtocolRepository.createTreatmentProtocol({
      ...data,
      createdById: userId,
      updatedById: userId,
    })
  }

  // Get treatment protocol by ID
  async getTreatmentProtocolById(id: number): Promise<TreatmentProtocol> {
    const protocol = await this.treatmentProtocolRepository.findTreatmentProtocolById(id)
    if (!protocol) {
      throw new NotFoundException('Treatment protocol not found')
    }
    return protocol
  }

  // Update treatment protocol
  async updateTreatmentProtocol(id: number, data: UpdateTreatmentProtocol, userId: number): Promise<TreatmentProtocol> {
    // Check if protocol exists
    await this.getTreatmentProtocolById(id)

    // If updating name, check if another protocol with same name exists
    if (data.name) {
      const existingProtocol = await this.treatmentProtocolRepository.findTreatmentProtocolByName(data.name)
      if (existingProtocol && existingProtocol.id !== id) {
        throw new ConflictException('Treatment protocol with this name already exists')
      }
    }

    return this.treatmentProtocolRepository.updateTreatmentProtocol(id, {
      ...data,
      updatedById: userId,
    })
  }

  // Delete treatment protocol
  async deleteTreatmentProtocol(id: number): Promise<TreatmentProtocol> {
    // Check if protocol exists
    await this.getTreatmentProtocolById(id)

    return this.treatmentProtocolRepository.deleteTreatmentProtocol(id)
  }

  // Get all treatment protocols with pagination and filtering
  async getAllTreatmentProtocols(query: unknown): Promise<PaginatedResponse<TreatmentProtocol>> {
    const options = this.paginationService.getPaginationOptions(query)
    const { search, targetDisease } = options as any

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          targetDisease: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    if (targetDisease) {
      where.targetDisease = {
        contains: targetDisease,
        mode: 'insensitive',
      }
    }

    return this.paginationService.paginate<TreatmentProtocol>(
      this.treatmentProtocolRepository.getTreatmentProtocolModel(),
      options,
      where,
      {
        medicines: {
          include: {
            medicine: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    )
  }

  // Search treatment protocols by query
  async searchTreatmentProtocols(query: string): Promise<TreatmentProtocol[]> {
    return this.treatmentProtocolRepository.searchTreatmentProtocols(query)
  }

  // Advanced search with multiple filters
  async advancedSearchTreatmentProtocols(params: {
    query?: string
    targetDisease?: string
    createdById?: number
    minMedicineCount?: number
    maxMedicineCount?: number
    limit?: number
    page?: number
  }): Promise<PaginatedResponse<TreatmentProtocol>> {
    const paginationOptions = this.paginationService.getPaginationOptions({
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '10',
    })

    const where: any = {}

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
        { targetDisease: { contains: params.query, mode: 'insensitive' } },
      ]
    }

    if (params.targetDisease) {
      where.targetDisease = { contains: params.targetDisease, mode: 'insensitive' }
    }

    if (params.createdById) {
      where.createdById = params.createdById
    }

    // For medicine count filtering, we'll need to use aggregation
    // This is a simplified implementation
    const include = {
      medicines: {
        include: {
          medicine: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    }

    return this.paginationService.paginate<TreatmentProtocol>(
      this.treatmentProtocolRepository.getTreatmentProtocolModel(),
      paginationOptions,
      where,
      include,
    )
  }

  // Find protocol by name
  async findTreatmentProtocolByName(name: string): Promise<TreatmentProtocol | null> {
    return this.treatmentProtocolRepository.findTreatmentProtocolByName(name)
  }

  // Get protocol usage statistics
  async getProtocolUsageStats(protocolId: number): Promise<{
    protocolId: number
    protocolName: string
    totalUsage: number
    activeUsage: number
    completedUsage: number
    successRate: number
  }> {
    const protocol = await this.getTreatmentProtocolById(protocolId)

    // This would need to be implemented in the repository with actual usage data
    // For now, return mock data structure
    return {
      protocolId,
      protocolName: protocol.name,
      totalUsage: 0,
      activeUsage: 0,
      completedUsage: 0,
      successRate: 0,
    }
  }

  // Get most popular protocols with pagination
  async getMostPopularProtocols(limit: number = 10): Promise<
    Array<{
      protocol: TreatmentProtocol
      usageCount: number
      successRate: number
    }>
  > {
    // Use pagination service for consistent pagination
    const paginationOptions = this.paginationService.getPaginationOptions({
      page: '1',
      limit: limit.toString(),
    })

    const protocols = await this.treatmentProtocolRepository.findTreatmentProtocols({
      take: paginationOptions.limit,
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        medicines: {
          include: {
            medicine: true,
          },
        },
      },
    })

    return protocols.map((protocol) => ({
      protocol,
      usageCount: 0, // This would come from actual usage tracking
      successRate: 0, // This would come from treatment outcomes
    }))
  }

  // Get protocols with custom variations
  async getProtocolsWithCustomVariations(): Promise<
    Array<{
      protocol: TreatmentProtocol
      customVariationCount: number
      mostCommonVariations: string[]
    }>
  > {
    // Use pagination service for consistent data handling
    const paginationOptions = this.paginationService.getPaginationOptions({
      page: '1',
      limit: '50', // Get a reasonable amount for analysis
    })

    const protocols = await this.treatmentProtocolRepository.findTreatmentProtocols({
      take: paginationOptions.limit,
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      include: {
        medicines: {
          include: {
            medicine: true,
          },
        },
      },
    })

    return protocols.map((protocol) => ({
      protocol,
      customVariationCount: 0, // This would come from patient treatment variations
      mostCommonVariations: [], // This would come from analysis of modifications
    }))
  }

  // Clone treatment protocol
  async cloneTreatmentProtocol(id: number, newName: string, userId: number): Promise<TreatmentProtocol> {
    const originalProtocol = await this.getTreatmentProtocolById(id)

    // Check if new name already exists
    const existingProtocol = await this.treatmentProtocolRepository.findTreatmentProtocolByName(newName)
    if (existingProtocol) {
      throw new ConflictException('Treatment protocol with this name already exists')
    }

    // Get the original protocol with medicines
    const protocolWithMedicines = await this.treatmentProtocolRepository.findTreatmentProtocolById(id, {
      medicines: {
        include: {
          medicine: true,
        },
      },
    })

    // Create new protocol data
    const newProtocolData = {
      name: newName,
      description: originalProtocol.description ? `${originalProtocol.description} (Cloned)` : 'Cloned protocol',
      targetDisease: originalProtocol.targetDisease,
      medicines:
        (protocolWithMedicines as any)?.medicines?.map((medicine: any) => ({
          medicineId: medicine.medicineId,
          dosage: medicine.dosage,
          duration: medicine.duration,
          notes: medicine.notes,
        })) || [],
    }

    return this.createTreatmentProtocol(newProtocolData, userId)
  }

  // Bulk create protocols
  async bulkCreateTreatmentProtocols(
    protocols: Array<{
      name: string
      description?: string
      targetDisease: string
      medicines: Array<{
        medicineId: number
        dosage: string
        duration: any
        notes?: string
      }>
    }>,
    userId: number,
    skipDuplicates: boolean = false,
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = []
    let successCount = 0

    for (const protocolData of protocols) {
      try {
        // Check for duplicates
        const existing = await this.treatmentProtocolRepository.findTreatmentProtocolByName(protocolData.name)
        if (existing && !skipDuplicates) {
          errors.push(`Protocol with name '${protocolData.name}' already exists`)
          continue
        }

        if (!existing) {
          await this.createTreatmentProtocol(protocolData, userId)
          successCount++
        }
      } catch (error) {
        errors.push(
          `Failed to create protocol '${protocolData.name}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }

    return { count: successCount, errors }
  }

  // Analytics and Reporting Methods

  async getProtocolEffectivenessMetrics(protocolId: number): Promise<{
    protocol: TreatmentProtocol | null
    totalUsages: number
    completedTreatments: number
    activeTreatments: number
    averageTreatmentDuration: number | null
    averageCost: number
    successRate: number | null
  }> {
    return this.treatmentProtocolRepository.getProtocolEffectivenessMetrics(protocolId)
  }

  async createCustomProtocolFromTreatment(
    treatmentId: number,
    protocolData: {
      name: string
      description?: string
      targetDisease: string
    },
    userId: number,
  ): Promise<TreatmentProtocol> {
    return this.treatmentProtocolRepository.createCustomProtocolFromTreatment(treatmentId, {
      ...protocolData,
      createdById: userId,
    })
  }

  async findTreatmentProtocolsPaginated(query: unknown): Promise<PaginatedResponse<TreatmentProtocol>> {
    // Validate query using existing schema or create new one if needed
    return this.treatmentProtocolRepository.findTreatmentProtocolsPaginated(query)
  }

  // Additional advanced analytics methods

  async getProtocolTrendAnalysis(params: {
    startDate?: Date
    endDate?: Date
    disease?: string
    limit?: number
  }): Promise<
    {
      protocol: TreatmentProtocol
      usageCount: number
      trend: 'increasing' | 'decreasing' | 'stable'
      changePercentage: number
    }[]
  > {
    // Implementation would require repository support for trend analysis
    // For now, return basic data from most popular protocols
    const popularProtocols = await this.getMostPopularProtocols(params.limit || 10)

    return popularProtocols.map((item) => ({
      protocol: item.protocol,
      usageCount: item.usageCount,
      trend: 'stable' as const, // Placeholder - would need historical data
      changePercentage: 0,
    }))
  }

  async getProtocolComparison(protocolIds: number[]): Promise<{
    protocols: TreatmentProtocol[]
    comparison: {
      protocolId: number
      name: string
      totalUsage: number
      successRate: number | null
      averageCost: number
      activeTreatments: number
    }[]
  }> {
    const protocols = await Promise.all(protocolIds.map((id) => this.getTreatmentProtocolById(id)))

    const comparison = await Promise.all(
      protocolIds.map(async (id) => {
        const stats = await this.getProtocolUsageStats(id)
        const effectiveness = await this.getProtocolEffectivenessMetrics(id)
        const protocol = protocols.find((p) => p.id === id)

        return {
          protocolId: id,
          name: protocol?.name || 'Unknown',
          totalUsage: stats.totalUsage,
          successRate: effectiveness.successRate,
          averageCost: effectiveness.averageCost,
          activeTreatments: effectiveness.activeTreatments,
        }
      }),
    )

    return { protocols, comparison }
  }
}
