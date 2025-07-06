import { Injectable } from '@nestjs/common'
import { Medicine } from '@prisma/client'
import { z } from 'zod'
import { MedicineRepository } from '../../repositories/medicine.repository'
import { ENTITY_NAMES } from '../../shared/constants/api.constants'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { SharedErrorHandlingService } from '../../shared/services/error-handling.service'
import { PaginationService } from '../../shared/services/pagination.service'
import { CreateMedicine, UpdateMedicine } from './medicine.model'

@Injectable()
export class MedicineService {
  constructor(
    private readonly medicineRepository: MedicineRepository,
    private readonly paginationService: PaginationService,
    private readonly errorHandlingService: SharedErrorHandlingService,
  ) {}

  // Create new medicine with enhanced validation
  async createMedicine(data: CreateMedicine): Promise<Medicine> {
    try {
      // Validate business rules
      const validation = await this.medicineRepository.validateMedicineBusinessRules({
        name: data.name,
        unit: data.unit,
        dose: data.dose,
        price: data.price,
      })

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Medicine creation warnings:', validation.warnings)
      }

      // Use the repository's validated create method
      return this.medicineRepository.createMedicine(data)
    } catch (error) {
      this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.MEDICINE)
      throw error // Đảm bảo luôn throw lại lỗi để test bắt được
    }
  }

  // Get medicine by ID
  async getMedicineById(id: number): Promise<Medicine> {
    const validatedId = this.errorHandlingService.validateId(id)
    const medicine = await this.medicineRepository.findMedicineById(validatedId)
    return this.errorHandlingService.validateEntityExists(medicine, ENTITY_NAMES.MEDICINE, validatedId)
  }

  // Update medicine
  async updateMedicine(id: number, data: UpdateMedicine): Promise<Medicine> {
    try {
      // Check if medicine exists
      await this.getMedicineById(id)

      // If updating name, check if another medicine with same name exists
      if (data.name) {
        const existingMedicine = await this.medicineRepository.findMedicineByName(data.name)
        // Luôn gọi validateNameUniqueness nếu có existing khác
        this.errorHandlingService.validateNameUniqueness(existingMedicine, data.name, ENTITY_NAMES.MEDICINE, id)
      }

      return this.medicineRepository.updateMedicine(id, data)
    } catch (error) {
      this.errorHandlingService.handlePrismaError(error, ENTITY_NAMES.MEDICINE)
      throw error // Đảm bảo luôn throw lại lỗi để test bắt được
    }

    return this.medicineRepository.updateMedicine(id, data)
  }

  // Delete medicine with dependency checking
  async deleteMedicine(id: number): Promise<Medicine> {
    // Check if medicine exists
    await this.getMedicineById(id)

    // Validate that medicine can be safely deleted
    const deleteValidation = await this.medicineRepository.validateMedicineCanBeDeleted(id)

    if (!deleteValidation.canDelete) {
      const issues: string[] = []

      if (deleteValidation.relatedProtocols.length > 0) {
        const protocolNames = deleteValidation.relatedProtocols.map((p) => p.name).join(', ')
        issues.push(`Medicine is used in treatment protocols: ${protocolNames}`)
      }

      if (deleteValidation.relatedActiveTreatments > 0) {
        issues.push(`Medicine is being used in ${deleteValidation.relatedActiveTreatments} active treatments`)
      }

      throw new Error(`Cannot delete medicine: ${issues.join('; ')}`)
    }

    return this.medicineRepository.deleteMedicine(id)
  }

  // Get all medicines with pagination and filtering
  async getAllMedicines(query: unknown): Promise<PaginatedResponse<Medicine>> {
    const options = this.paginationService.getPaginationOptions(query)

    // Use the repository's paginated method for enhanced filtering and consistency
    return this.medicineRepository.findMedicinesPaginated(options)
  }

  // Search medicines by query
  async searchMedicines(query: string): Promise<Medicine[]> {
    return this.medicineRepository.searchMedicines(query)
  }

  // New method: Get medicines by price range with validation
  async getMedicinesByPriceRange(minPrice: number, maxPrice: number): Promise<Medicine[]> {
    // Additional validation can be done here if needed
    if (minPrice < 0 || maxPrice < 0) {
      throw new Error('Price values must be non-negative')
    }

    if (maxPrice < minPrice) {
      throw new Error('Maximum price must be greater than or equal to minimum price')
    }

    return this.medicineRepository.getMedicinesByPriceRange(minPrice, maxPrice)
  }

  // New method: Advanced search with comprehensive validation
  async advancedSearchMedicines(params: {
    query?: string
    minPrice?: number
    maxPrice?: number
    unit?: string
    limit?: number
    page?: number
  }): Promise<{
    medicines: Medicine[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    // Get medicines using validated repository method
    const medicines = await this.medicineRepository.advancedSearchMedicines(params)

    const total = medicines.length // This is simplified
    const limit = params.limit || 10
    const page = params.page || 1
    const totalPages = Math.ceil(total / limit)

    return {
      medicines,
      total,
      page,
      limit,
      totalPages,
    }
  }

  // New method: Bulk create medicines with validation
  async createManyMedicines(
    medicines: Array<{
      name: string
      description?: string
      unit: string
      dose: string
      price: number
    }>,
    skipDuplicates: boolean = false,
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = []

    try {
      // Check for duplicate names in the input
      const names = medicines.map((m) => m.name.toLowerCase())
      const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index)

      if (duplicateNames.length > 0 && !skipDuplicates) {
        errors.push(`Duplicate names found in input: ${duplicateNames.join(', ')}`)
      }

      // Check for existing medicines in database
      for (const medicine of medicines) {
        const existing = await this.medicineRepository.findMedicineByName(medicine.name)
        if (existing && !skipDuplicates) {
          errors.push(`Medicine with name '${medicine.name}' already exists`)
        }
      }

      if (errors.length > 0 && !skipDuplicates) {
        return { count: 0, errors }
      }

      // Use validated repository method
      const result = await this.medicineRepository.createManyMedicines(medicines, skipDuplicates)

      return { count: result.count, errors }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle Zod validation errors
        const zodErrors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`)
        errors.push(...zodErrors)
      } else {
        errors.push(error instanceof Error ? error.message : 'Unknown error occurred')
      }

      return { count: 0, errors }
    }
  }

  // ===============================
  // STATISTICS AND ANALYTICS FOR MEDICINE
  // ===============================

  /**
   * Get medicine usage statistics (top used, usage rate, cost analysis)
   */
  async getMedicineUsageStats(): Promise<{
    totalMedicines: number
    topUsedMedicines: Array<{
      medicineId: number
      medicineName: string
      usageCount: number
    }>
    totalCost: number
    averageCost: number
  }> {
    // Logging performance
    const start = Date.now()
    // Get all medicines (pagination with large limit)
    const allMedicinesResult = await this.medicineRepository.findMedicinesPaginated({
      page: 1,
      limit: 10000,
      sortOrder: 'desc',
    })
    const allMedicines = allMedicinesResult.data
    // Helper chuyển price về number an toàn
    function toNumberSafe(price: unknown): number {
      if (typeof price === 'number') return price
      if (price && typeof price === 'object' && typeof (price as any).toNumber === 'function') {
        const num = Number((price as any).toNumber())
        return isNaN(num) ? 0 : num
      }
      const parsed = Number(price)
      return isNaN(parsed) ? 0 : parsed
    }
    // Khi tính toán cost/average: chỉ lấy thuốc có giá là số hợp lệ và > 0 (loại giá 0, NaN, undefined, null, không phải số)
    const medicinesWithPositivePrice = allMedicines.filter((m) => {
      const price = m.price
      if (typeof price === 'number') {
        return !isNaN(price) && price > 0
      }
      if (typeof price === 'string') {
        const parsed = Number(price)
        return !isNaN(parsed) && parsed > 0
      }
      if (typeof price === 'object' && price !== null && typeof (price as any).toNumber === 'function') {
        const num = Number((price as any).toNumber())
        return typeof num === 'number' && !isNaN(num) && num > 0
      }
      return false
    })
    // Fake usage count for demo (should be replaced by real usage if available)
    const topUsedMedicines = medicinesWithPositivePrice
      .map((m) => ({ medicineId: m.id, medicineName: m.name, usageCount: Math.floor(Math.random() * 100) }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
    // Cost analysis
    const totalCost = medicinesWithPositivePrice.reduce((sum, m) => {
      if (typeof m.price === 'number') return sum + Number(m.price)
      if (typeof m.price === 'string') return sum + Number(m.price)
      if (typeof m.price === 'object' && m.price !== null && typeof (m.price as any).toNumber === 'function')
        return sum + Number((m.price as any).toNumber())
      return sum
    }, 0)
    const averageCost = medicinesWithPositivePrice.length > 0 ? totalCost / medicinesWithPositivePrice.length : 0
    // Logging
    console.log(`[MedicineService] getMedicineUsageStats executed in ${Date.now() - start}ms`)
    return {
      totalMedicines: allMedicines.length,
      topUsedMedicines,
      totalCost: Math.round(totalCost * 100) / 100,
      averageCost: Math.round(averageCost * 100) / 100,
    }
  }
}
