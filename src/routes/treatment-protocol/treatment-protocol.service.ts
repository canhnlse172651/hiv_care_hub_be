import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { TreatmentProtocolRepository } from '../../repositories/treatment-protocol.repository'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
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
  constructor(private readonly treatmentProtocolRepository: TreatmentProtocolRepository) {}

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
        sortOrder: sortOrder || 'asc',
        search,
      }

      const filters = {
        targetDisease,
        createdById,
        name,
      }

      const result = await this.treatmentProtocolRepository.findWithAdvancedFiltering(paginationOptions, filters)

      // Get full protocol details for each item in the result
      const protocolsWithDetails = await Promise.all(
        result.data.map((protocol) => this.treatmentProtocolRepository.getProtocolWithDetails(protocol.id)),
      )

      return {
        data: protocolsWithDetails.filter(Boolean) as TreatmentProtocolResponseType[],
        meta: {
          page: result.meta.page,
          limit: result.meta.limit,
          total: result.meta.total,
          totalPages: result.meta.totalPages,
          hasNextPage: result.meta.hasNext,
          hasPreviousPage: result.meta.hasPrevious,
        },
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
