import { Injectable } from '@nestjs/common'
import { Medicine, Prisma } from '@prisma/client'
import { createPaginationSchema, PaginatedResponse, PaginationOptions } from '../shared/schemas/pagination.schema'
import { PaginationService } from '../shared/services/pagination.service'
import { PrismaService } from '../shared/services/prisma.service'
import { z } from 'zod'
import { BaseRepository, PrismaModel } from './base.repository'

// Zod schemas for Medicine validation
export const MedicineSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().min(1).max(100).optional().default(50),
})

export const CreateMedicineDataSchema = z.object({
  name: z.string().min(1, 'Medicine name is required').max(500),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required').max(100),
  dose: z.string().min(1, 'Dose is required').max(100),
  price: z.number().min(0, 'Price must be non-negative'),
})

@Injectable()
export class MedicineRepository extends BaseRepository<
  Medicine,
  Prisma.MedicineCreateInput,
  Prisma.MedicineUpdateInput,
  Prisma.MedicineWhereInput,
  Prisma.MedicineWhereUniqueInput,
  Prisma.MedicineOrderByWithRelationInput,
  Prisma.MedicineInclude
> {
  constructor(
    prismaService: PrismaService,
    private readonly paginationService: PaginationService,
  ) {
    super(prismaService)
  }

  // Implementation required by BaseRepository
  getModel(): PrismaModel<
    Medicine,
    Prisma.MedicineCreateInput,
    Prisma.MedicineUpdateInput,
    Prisma.MedicineWhereInput,
    Prisma.MedicineWhereUniqueInput,
    Prisma.MedicineOrderByWithRelationInput
  > {
    return this.prismaService.medicine
  }

  // Get model for pagination (alias for compatibility)
  getMedicineModel() {
    return this.getModel()
  }

  // Custom methods specific to Medicine
  async findMedicineById(id: number, include?: any): Promise<Medicine | null> {
    return this.findById(id, { include })
  }

  async findMedicineByName(name: string): Promise<Medicine | null> {
    // Validate name parameter
    const nameSchema = z.string().min(1, 'Name is required')
    const validatedName = nameSchema.parse(name)

    return this.findFirst({ name: validatedName })
  }

  async createMedicine(data: {
    name: string
    description?: string
    unit: string
    dose: string
    price: number
  }): Promise<Medicine> {
    // Validate input data using Zod
    const validatedData = CreateMedicineDataSchema.parse(data)

    return this.create({
      name: validatedData.name,
      description: validatedData.description,
      unit: validatedData.unit,
      dose: validatedData.dose,
      price: validatedData.price,
    })
  }

  async updateMedicine(
    id: number,
    data: {
      name?: string
      description?: string
      unit?: string
      dose?: string
      price?: number
    },
  ): Promise<Medicine> {
    // Validate partial update data
    const updateSchema = CreateMedicineDataSchema.partial()
    const validatedData = updateSchema.parse(data)

    return this.updateById(id, validatedData)
  }

  async deleteMedicine(id: number): Promise<Medicine> {
    return this.deleteById(id)
  }

  async findMedicines(params: {
    skip?: number
    take?: number
    where?: Prisma.MedicineWhereInput
    orderBy?: Prisma.MedicineOrderByWithRelationInput
    include?: Prisma.MedicineInclude
  }): Promise<Medicine[]> {
    return this.findMany(params)
  }

  async countMedicines(where?: Prisma.MedicineWhereInput): Promise<number> {
    return this.count(where)
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    // Validate search parameters
    const validatedParams = MedicineSearchSchema.parse({ query })

    return this.search(['name', 'description'], validatedParams.query, {
      orderBy: { name: 'asc' },
      take: validatedParams.limit,
    })
  }

  /**
   * Find medicines with pagination using PaginationService
   * Supports search, filtering, and sorting capabilities
   */
  async findMedicinesPaginated(
    options: PaginationOptions<{
      name?: string
      description?: string
      unit?: string
      minPrice?: number
      maxPrice?: number
    }>,
  ): Promise<PaginatedResponse<Medicine>> {
    // chấp nhận filters là object hoặc string
    let filtersObj: any = undefined
    if (options.filters) {
      if (typeof options.filters === 'string') {
        try {
          filtersObj = JSON.parse(options.filters)
        } catch {
          filtersObj = {}
        }
      } else {
        filtersObj = options.filters
      }
    }

    // Create filter schema for medicine-specific filters
    const medicineFilterSchema = z
      .object({
        name: z.string().optional(),
        description: z.string().optional(),
        unit: z.string().optional(),
        minPrice: z.number().min(0).optional(),
        maxPrice: z.number().min(0).optional(),
      })
      .optional()

    // Create pagination schema with medicine filter
    const paginationSchema = createPaginationSchema(medicineFilterSchema)

    // Validate and parse options
    const validatedOptions = {
      ...options,
      filters: filtersObj,
      page: options.page,
      limit: options.limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields,
    }

    // Build Prisma where clause
    const where: Prisma.MedicineWhereInput = {}

    // Đảm bảo searchFields luôn là mảng
    const searchFields = validatedOptions.searchFields ?? ['name', 'description']

    // Apply search if provided
    if (validatedOptions.search) {
      const searchConditions: Prisma.MedicineWhereInput[] = []

      if (searchFields.includes('name')) {
        searchConditions.push({
          name: { contains: validatedOptions.search, mode: 'insensitive' },
        })
      }

      if (searchFields.includes('description')) {
        searchConditions.push({
          description: { contains: validatedOptions.search, mode: 'insensitive' },
        })
      }

      if (searchConditions.length > 0) {
        where.OR = searchConditions
      }
    }

    // Apply filters if provided
    if (validatedOptions.filters) {
      const filters = validatedOptions.filters

      if (filters.name) {
        where.name = { contains: filters.name, mode: 'insensitive' }
      }

      if (filters.description) {
        where.description = { contains: filters.description, mode: 'insensitive' }
      }

      if (filters.unit) {
        where.unit = { contains: filters.unit, mode: 'insensitive' }
      }

      // Price range filtering
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {}
        if (filters.minPrice !== undefined) {
          where.price.gte = filters.minPrice
        }
        if (filters.maxPrice !== undefined) {
          where.price.lte = filters.maxPrice
        }
      }
    }

    // Build order by clause
    const orderBy: Prisma.MedicineOrderByWithRelationInput = {}
    if (validatedOptions.sortBy) {
      const sortField = validatedOptions.sortBy as keyof Medicine
      if (['name', 'description', 'unit', 'dose', 'price', 'createdAt', 'updatedAt'].includes(sortField)) {
        orderBy[sortField] = validatedOptions.sortOrder
      }
    } else {
      orderBy.name = 'asc' // Default sort by name
    }

    // Use PaginationService for paginated query
    return this.paginationService.paginate(
      this.getMedicineModel(),
      validatedOptions,
      where,
      undefined, // include
    )
  }

  // Batch create medicines with validation
  async createManyMedicines(
    medicines: Array<{
      name: string
      description?: string
      unit: string
      dose: string
      price: number
    }>,
    skipDuplicates?: boolean,
  ): Promise<{ count: number }> {
    // Validate all medicine data
    const validatedMedicines = z.array(CreateMedicineDataSchema).parse(medicines)

    return this.createMany(validatedMedicines, skipDuplicates)
  }

  // Get medicines by price range with validation
  async getMedicinesByPriceRange(minPrice: number, maxPrice: number): Promise<Medicine[]> {
    const priceRangeSchema = z
      .object({
        minPrice: z.number().min(0, 'Minimum price must be non-negative'),
        maxPrice: z.number().min(0, 'Maximum price must be non-negative'),
      })
      .refine((data) => data.maxPrice >= data.minPrice, {
        message: 'Maximum price must be greater than or equal to minimum price',
      })

    const { minPrice: validMinPrice, maxPrice: validMaxPrice } = priceRangeSchema.parse({
      minPrice,
      maxPrice,
    })

    return this.findMany({
      where: {
        price: {
          gte: validMinPrice,
          lte: validMaxPrice,
        },
      },
      orderBy: { price: 'asc' },
    })
  }

  // Advanced search with filters and validation
  async advancedSearchMedicines(params: {
    query?: string
    minPrice?: number
    maxPrice?: number
    unit?: string
    limit?: number
    page?: number
  }): Promise<Medicine[]> {
    const searchParamsSchema = z
      .object({
        query: z.string().min(1).optional(),
        minPrice: z.number().min(0).optional(),
        maxPrice: z.number().min(0).optional(),
        unit: z.string().min(1).optional(),
        limit: z.number().min(1).max(100).optional().default(10),
        page: z.number().min(1).optional().default(1),
      })
      .refine(
        (data) => {
          if (data.minPrice !== undefined && data.maxPrice !== undefined) {
            return data.maxPrice >= data.minPrice
          }
          return true
        },
        {
          message: 'Maximum price must be greater than or equal to minimum price',
        },
      )

    const validatedParams = searchParamsSchema.parse(params)

    const where: Prisma.MedicineWhereInput = {}

    // Build search conditions
    if (validatedParams.query) {
      where.OR = [
        { name: { contains: validatedParams.query, mode: 'insensitive' } },
        { description: { contains: validatedParams.query, mode: 'insensitive' } },
      ]
    }

    if (validatedParams.minPrice !== undefined || validatedParams.maxPrice !== undefined) {
      where.price = {}
      if (validatedParams.minPrice !== undefined) {
        where.price.gte = validatedParams.minPrice
      }
      if (validatedParams.maxPrice !== undefined) {
        where.price.lte = validatedParams.maxPrice
      }
    }

    if (validatedParams.unit) {
      where.unit = { contains: validatedParams.unit, mode: 'insensitive' }
    }

    const skip = (validatedParams.page - 1) * validatedParams.limit

    return this.findMany({
      where,
      skip,
      take: validatedParams.limit,
      orderBy: { name: 'asc' },
    })
  }

  // Business Logic Validation Methods

  /**
   * Check if medicine can be safely deleted
   * A medicine cannot be deleted if it's used in any treatment protocols
   */
  async validateMedicineCanBeDeleted(id: number): Promise<{
    canDelete: boolean
    relatedProtocols: { id: number; name: string }[]
    relatedActiveTreatments: number
  }> {
    const validatedId = this.validateId(id)

    // Check if medicine is used in any treatment protocols
    const relatedProtocols = await this.prismaService.protocolMedicine.findMany({
      where: { medicineId: validatedId },
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Check if there are active patient treatments using this medicine
    const activeTreatmentsCount = await this.prismaService.patientTreatment.count({
      where: {
        OR: [
          { protocol: { medicines: { some: { medicineId: validatedId } } } },
          // For JSON field search, we'll use string contains for now
          {
            customMedications: {
              string_contains: `"medicineId":${validatedId}`,
            },
          },
        ],
        AND: [
          { endDate: { gte: new Date() } }, // Active treatments
        ],
      },
    })

    const protocols = relatedProtocols.map((rp) => ({
      id: rp.protocol.id,
      name: rp.protocol.name,
    }))

    return {
      canDelete: protocols.length === 0 && activeTreatmentsCount === 0,
      relatedProtocols: protocols,
      relatedActiveTreatments: activeTreatmentsCount,
    }
  }

  /**
   * Validate medicine data consistency
   */
  async validateMedicineBusinessRules(data: { name: string; unit: string; dose: string; price: number }): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for duplicate names (case-insensitive)
    const existingMedicine = await this.findFirst({
      name: { equals: data.name, mode: 'insensitive' },
    })

    if (existingMedicine) {
      errors.push(`Medicine with name '${data.name}' already exists`)
    }

    // Validate unit and dose compatibility
    const dosageNumber = parseFloat(data.dose.replace(/[^\d.]/g, ''))
    if (isNaN(dosageNumber)) {
      warnings.push('Dose should contain numeric value for better processing')
    }

    // Validate price consistency
    if (data.price <= 0) {
      errors.push('Medicine price must be greater than 0')
    }

    if (data.price > 999999) {
      warnings.push('Medicine price seems unusually high')
    }

    // Check for reasonable unit values
    const commonUnits = ['mg', 'ml', 'g', 'tablet', 'capsule', 'injection', 'drop', 'spray']
    if (!commonUnits.some((unit) => data.unit.toLowerCase().includes(unit.toLowerCase()))) {
      warnings.push(
        'Unit value might not be standard. Common units: mg, ml, g, tablet, capsule, injection, drop, spray',
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}
