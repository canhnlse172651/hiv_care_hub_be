/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { MedicineRepository } from '../../repositories/medicine.repository'
import {
  CreateMedicineDtoType,
  UpdateMedicineDtoType,
  MedicineResponseType,
  QueryMedicineDtoType,
  BulkUpdatePricesDtoType,
} from './medicine.dto'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'

@Injectable()
export class MedicineService {
  constructor(private readonly medicineRepository: MedicineRepository) {}

  async createMedicine(data: CreateMedicineDtoType, userId?: number): Promise<MedicineResponseType> {
    try {
      const medicine = await this.medicineRepository.create(data, userId)
      return {
        ...medicine,
        price: Number(medicine.price),
      }
    } catch (error) {
      throw new BadRequestException('Failed to create medicine')
    }
  }

  async getAllMedicines(query: QueryMedicineDtoType): Promise<PaginatedResponse<MedicineResponseType>> {
    try {
      const { page, limit, sortBy, sortOrder, search, name, unit, priceMin, priceMax } = query

      const paginationOptions = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        sortBy: sortBy || 'name',
        sortOrder: sortOrder || 'asc',
        search,
      }

      const filters = {
        name,
        unit,
        priceMin,
        priceMax,
      }

      const result = await this.medicineRepository.findWithAdvancedFiltering(paginationOptions, filters)

      return {
        ...result,
        data: result.data.map((medicine) => ({
          ...medicine,
          price: Number(medicine.price),
        })),
        meta: {
          ...result.meta,
          hasNextPage: result.meta.hasNext,
          hasPreviousPage: result.meta.hasPrevious,
        },
      }
    } catch (error) {
      throw new BadRequestException('Failed to fetch medicines')
    }
  }

  async getMedicineById(id: number): Promise<MedicineResponseType> {
    const medicine = await this.medicineRepository.findById(id)
    if (!medicine) {
      throw new NotFoundException('Medicine not found')
    }
    return {
      ...medicine,
      price: Number(medicine.price),
    }
  }

  async updateMedicine(id: number, data: UpdateMedicineDtoType, userId?: number): Promise<MedicineResponseType> {
    try {
      const existingMedicine = await this.medicineRepository.findById(id)
      if (!existingMedicine) {
        throw new NotFoundException('Medicine not found')
      }

      const updatedMedicine = await this.medicineRepository.update(id, data, userId)
      return {
        ...updatedMedicine,
        price: Number(updatedMedicine.price),
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to update medicine')
    }
  }

  async deleteMedicine(id: number): Promise<MedicineResponseType> {
    try {
      const existingMedicine = await this.medicineRepository.findById(id)
      if (!existingMedicine) {
        throw new NotFoundException('Medicine not found')
      }

      const deletedMedicine = await this.medicineRepository.delete(id)
      return {
        ...deletedMedicine,
        price: Number(deletedMedicine.price),
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to delete medicine')
    }
  }

  async searchMedicines(searchTerm: string): Promise<MedicineResponseType[]> {
    try {
      const medicines = await this.medicineRepository.searchByNameOrDescription(searchTerm)
      return medicines.map((medicine) => ({
        ...medicine,
        price: Number(medicine.price),
      }))
    } catch (error) {
      throw new BadRequestException('Failed to search medicines')
    }
  }

  async getMedicinesByPriceRange(minPrice?: number, maxPrice?: number): Promise<MedicineResponseType[]> {
    try {
      const medicines = await this.medicineRepository.findWithPriceRange(minPrice, maxPrice)
      return medicines.map((medicine) => ({
        ...medicine,
        price: Number(medicine.price),
      }))
    } catch (error) {
      throw new BadRequestException('Failed to filter medicines by price')
    }
  }

  async getMedicinesByUnit(unit: string): Promise<MedicineResponseType[]> {
    try {
      const medicines = await this.medicineRepository.findByUnit(unit)
      return medicines.map((medicine) => ({
        ...medicine,
        price: Number(medicine.price),
      }))
    } catch (error) {
      throw new BadRequestException('Failed to filter medicines by unit')
    }
  }

  async getMedicineUsageStats(id: number) {
    try {
      const stats = await this.medicineRepository.getMedicineUsageStats(id)
      if (!stats) {
        throw new NotFoundException('Medicine not found')
      }
      return stats
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to get medicine usage statistics')
    }
  }

  async getMostUsedMedicines(limit = 10) {
    try {
      return await this.medicineRepository.getMostUsedMedicines(limit)
    } catch (error) {
      throw new BadRequestException('Failed to get most used medicines')
    }
  }

  async bulkUpdatePrices(data: BulkUpdatePricesDtoType, userId: number) {
    try {
      return await this.medicineRepository.bulkUpdatePrices(data.updates, userId)
    } catch (error) {
      throw new BadRequestException('Failed to bulk update medicine prices')
    }
  }

  async restoreMedicine(id: number): Promise<MedicineResponseType | null> {
    try {
      const restored = await this.medicineRepository.restore(id)
      if (!restored) {
        throw new NotFoundException('Medicine not found or cannot be restored')
      }
      return {
        ...restored,
        price: Number(restored.price),
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to restore medicine')
    }
  }
}
