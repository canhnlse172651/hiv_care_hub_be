import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { TreatmentProtocolRepository } from '../../repositories/treatment-protocol.repository'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { PaginationService } from '../../shared/services/pagination.service'
import { PopularProtocol } from '../../shared/types'
import {
  AddMedicineToProtocolDtoType,
  CloneProtocolDtoType,
  CreateTreatmentProtocolDtoType,
  QueryTreatmentProtocolDtoType,
  TreatmentProtocolResponseType,
  UpdateMedicineInProtocolDtoType,
  UpdateTreatmentProtocolDtoType,
} from './treatment-protocol.dto'

@Injectable()
export class TreatmentProtocolService {
  constructor(
    private readonly treatmentProtocolRepository: TreatmentProtocolRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createProtocol(data: CreateTreatmentProtocolDtoType, userId: number): Promise<TreatmentProtocolResponseType> {
    try {
      return await this.treatmentProtocolRepository.createWithMedicines(data, userId)
    } catch (error) {
      throw new BadRequestException('Failed to create treatment protocol')
    }
  }

  async getAllProtocols(
    query: QueryTreatmentProtocolDtoType,
  ): Promise<PaginatedResponse<TreatmentProtocolResponseType>> {
    try {
      const { page, limit, sortBy, sortOrder, search, targetDisease, createdById, name } = query

      const paginationOptions = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        sortBy: sortBy || 'name',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
        search,
      }

      // Build where condition
      const where: any = {
        deletedAt: null, // Filter soft-deleted protocols
      }

      // Add specific filters
      if (targetDisease) {
        where.targetDisease = targetDisease
      }

      if (createdById) {
        where.createdById = createdById
      }

      if (name) {
        where.name = { contains: name, mode: 'insensitive' }
      }

      // Add search conditions if search term is provided
      if (search) {
        const searchConditions = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { targetDisease: { contains: search, mode: 'insensitive' } },
        ]

        // If we have other filters, combine with AND
        const hasOtherFilters = targetDisease || createdById || name
        if (hasOtherFilters) {
          where.AND = [{ OR: searchConditions }]
        } else {
          where.OR = searchConditions
        }
      }

      const result = await this.paginationService.paginate(
        this.treatmentProtocolRepository.getTreatmentProtocolModel(),
        paginationOptions,
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
              firstName: true,
              lastName: true,
            },
          },
        },
      )

      return {
        data: result.data as TreatmentProtocolResponseType[],
        meta: result.meta,
      }
    } catch (error) {
      throw new BadRequestException('Failed to fetch treatment protocols')
    }
  }

  async getProtocolById(id: number): Promise<TreatmentProtocolResponseType> {
    const protocol = await this.treatmentProtocolRepository.getProtocolWithDetails(id)
    if (!protocol) {
      throw new NotFoundException('Treatment protocol not found')
    }
    return protocol
  }

  async updateProtocol(
    id: number,
    data: UpdateTreatmentProtocolDtoType,
    userId: number,
  ): Promise<TreatmentProtocolResponseType> {
    try {
      const existingProtocol = await this.treatmentProtocolRepository.findById(id)
      if (!existingProtocol) {
        throw new NotFoundException('Treatment protocol not found')
      }

      await this.treatmentProtocolRepository.update(id, data, userId)
      const updatedProtocol = await this.treatmentProtocolRepository.getProtocolWithDetails(id)
      if (!updatedProtocol) {
        throw new NotFoundException('Treatment protocol not found after update')
      }
      return updatedProtocol
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to update treatment protocol')
    }
  }

  async deleteProtocol(id: number): Promise<TreatmentProtocolResponseType> {
    try {
      const existingProtocol = await this.treatmentProtocolRepository.getProtocolWithDetails(id)
      if (!existingProtocol) {
        throw new NotFoundException('Treatment protocol not found')
      }

      await this.treatmentProtocolRepository.delete(id)
      return existingProtocol
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to delete treatment protocol')
    }
  }

  async addMedicineToProtocol(protocolId: number, data: AddMedicineToProtocolDtoType) {
    try {
      const existingProtocol = await this.treatmentProtocolRepository.findById(protocolId)
      if (!existingProtocol) {
        throw new NotFoundException('Treatment protocol not found')
      }

      return await this.treatmentProtocolRepository.addMedicineToProtocol(protocolId, data)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to add medicine to protocol')
    }
  }

  async removeMedicineFromProtocol(protocolId: number, medicineId: number) {
    try {
      const existingProtocol = await this.treatmentProtocolRepository.findById(protocolId)
      if (!existingProtocol) {
        throw new NotFoundException('Treatment protocol not found')
      }

      return await this.treatmentProtocolRepository.removeMedicineFromProtocol(protocolId, medicineId)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to remove medicine from protocol')
    }
  }

  async updateMedicineInProtocol(protocolId: number, medicineId: number, data: UpdateMedicineInProtocolDtoType) {
    try {
      const existingProtocol = await this.treatmentProtocolRepository.findById(protocolId)
      if (!existingProtocol) {
        throw new NotFoundException('Treatment protocol not found')
      }

      return await this.treatmentProtocolRepository.updateMedicineInProtocol(protocolId, medicineId, data)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to update medicine in protocol')
    }
  }

  async cloneProtocol(
    originalProtocolId: number,
    data: CloneProtocolDtoType,
    userId: number,
  ): Promise<TreatmentProtocolResponseType> {
    try {
      const originalProtocol = await this.treatmentProtocolRepository.findById(originalProtocolId)
      if (!originalProtocol) {
        throw new NotFoundException('Original protocol not found')
      }

      return await this.treatmentProtocolRepository.cloneProtocol(originalProtocolId, data, userId)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to clone protocol')
    }
  }

  async getProtocolsByTargetDisease(targetDisease: string): Promise<TreatmentProtocolResponseType[]> {
    try {
      return await this.treatmentProtocolRepository.findByTargetDisease(targetDisease)
    } catch (error) {
      throw new BadRequestException('Failed to get protocols by target disease')
    }
  }

  async getProtocolsByDoctor(doctorId: number): Promise<TreatmentProtocolResponseType[]> {
    try {
      return await this.treatmentProtocolRepository.findByDoctor(doctorId)
    } catch (error) {
      throw new BadRequestException('Failed to get protocols by doctor')
    }
  }

  async getProtocolUsageStats(id: number) {
    try {
      const stats = await this.treatmentProtocolRepository.getProtocolUsageStats(id)
      if (!stats) {
        throw new NotFoundException('Protocol not found')
      }
      return stats
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to get protocol usage statistics')
    }
  }

  async getMostPopularProtocols(limit = 10): Promise<PopularProtocol[]> {
    try {
      return await this.treatmentProtocolRepository.getMostPopularProtocols(limit)
    } catch (error) {
      throw new BadRequestException('Failed to get most popular protocols')
    }
  }

  async restoreProtocol(id: number): Promise<TreatmentProtocolResponseType | null> {
    try {
      const restored = await this.treatmentProtocolRepository.restore(id)
      if (!restored) {
        throw new NotFoundException('Protocol not found or cannot be restored')
      }
      return await this.treatmentProtocolRepository.getProtocolWithDetails(id)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to restore protocol')
    }
  }
}
