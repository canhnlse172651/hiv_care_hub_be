import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Medicine } from '@prisma/client'
import { z } from 'zod'
import { MedicineRepository } from '../../repositories/medicine.repository'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { PaginationService } from '../../shared/services/pagination.service'
import { CreateMedicine, UpdateMedicine } from './medicine.model'

@Injectable()
export class MedicineService {
  constructor(
    private readonly medicineRepository: MedicineRepository,
    private readonly paginationService: PaginationService,
  ) {}

  // Create new medicine
  async createMedicine(data: CreateMedicine): Promise<Medicine> {
    // Check if medicine with same name already exists
    const existingMedicine = await this.medicineRepository.findMedicineByName(data.name)
    if (existingMedicine) {
      throw new ConflictException('Medicine with this name already exists')
    }

    // Use the repository's validated create method
    return this.medicineRepository.createMedicine(data)
  }

  // Get medicine by ID
  async getMedicineById(id: number): Promise<Medicine> {
    const medicine = await this.medicineRepository.findMedicineById(id)
    if (!medicine) {
      throw new NotFoundException('Medicine not found')
    }
    return medicine
  }

  // Update medicine
  async updateMedicine(id: number, data: UpdateMedicine): Promise<Medicine> {
    // Check if medicine exists
    await this.getMedicineById(id)

    // If updating name, check if another medicine with same name exists
    if (data.name) {
      const existingMedicine = await this.medicineRepository.findMedicineByName(data.name)
      if (existingMedicine && existingMedicine.id !== id) {
        throw new ConflictException('Medicine with this name already exists')
      }
    }

    return this.medicineRepository.updateMedicine(id, data)
  }

  // Delete medicine
  async deleteMedicine(id: number): Promise<Medicine> {
    // Check if medicine exists
    await this.getMedicineById(id)

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
}
