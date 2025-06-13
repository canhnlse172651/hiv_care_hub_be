import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PaginationService } from 'src/shared/services/pagination.service'
import { Medicine, Prisma } from '@prisma/client'
import { BaseRepository, PrismaModel } from './base.repository'
import { createPaginationSchema, PaginatedResponse, PaginationOptions } from 'src/shared/schemas/pagination.schema'
import { z } from 'zod'

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
   *
   * @param options - Pagination options with medicine-specific filters
   * @returns Paginated response with medicines and metadata
   *
   * Supported filters:
   * - name: Filter by medicine name (partial match, case-insensitive)
   * - description: Filter by description (partial match, case-insensitive)
   * - unit: Filter by unit (partial match, case-insensitive)
   * - minPrice: Filter by minimum price
   * - maxPrice: Filter by maximum price
   *
   * Supported search fields: name, description
   * Supported sort fields: name, description, unit, dose, price, createdAt, updatedAt
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
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields,
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    // Build Prisma where clause
    const where: Prisma.MedicineWhereInput = {}

    // Apply search if provided
    if (validatedOptions.search) {
      const searchConditions: Prisma.MedicineWhereInput[] = []

      if (validatedOptions.searchFields.includes('name')) {
        searchConditions.push({
          name: { contains: validatedOptions.search, mode: 'insensitive' },
        })
      }

      if (validatedOptions.searchFields.includes('description')) {
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
}
