import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../shared/services/prisma.service'
import { PaginationService } from '../shared/services/pagination.service'
import { CreateTestDtoType, UpdateTestDtoType } from '../routes/test/test.dto'
import { PaginatedResponse, PaginationOptions } from '../shared/schemas/pagination.schema'
import { createPaginationSchema } from '../shared/schemas/pagination.schema'
import { OrderByClause, TestFilter } from '../shared/interfaces/query.interface'
import { TestFilterSchema } from 'src/routes/test-result/test-result.model'

// Use more flexible type definition
type TestModel = {
  id: number
  name: string
  description: string | null
  method: string | null
  category: string | null
  isQuantitative: boolean
  unit: string | null
  cutOffValue: Prisma.Decimal | null
  price: Prisma.Decimal
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class TestRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  // Lấy model cho pagination - similar to blog repository
  getTestModel(): typeof this.prisma.test {
    return this.prisma.test
  }

  async createTest(data: CreateTestDtoType): Promise<TestModel> {
    const result = await this.prisma.test.create({
      data,
    })
    return result as TestModel
  }

  async findTestById(id: number): Promise<TestModel> {
    const test = await this.prisma.test.findUnique({
      where: { id },
    })
    if (!test) throw new Error(`Test with ID ${id} not found`)
    return test as TestModel
  }

  async findTestsPaginated(options: PaginationOptions<TestFilter>): Promise<PaginatedResponse<TestModel>> {
    const paginationSchema = createPaginationSchema(TestFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields || ['name', 'description'],
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: Prisma.TestWhereInput = {}

    if (validatedOptions.search) {
      where.OR = [
        { name: { contains: validatedOptions.search, mode: 'insensitive' } },
        { description: { contains: validatedOptions.search, mode: 'insensitive' } },
      ]
    }

    if (validatedOptions.filters) {
      const { category, isQuantitative } = validatedOptions.filters

      if (category) where.category = category
      if (isQuantitative !== undefined) where.isQuantitative = isQuantitative
    }

    const orderBy: any = {}
    if (validatedOptions.sortBy && validatedOptions.sortOrder) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    return this.paginationService.paginate(this.prisma.test, validatedOptions, where, {})
  }

  async updateTest(id: number, data: UpdateTestDtoType): Promise<TestModel> {
    const result = await this.prisma.test.update({
      where: { id },
      data,
    })
    return result as TestModel
  }

  async deleteTest(id: number): Promise<TestModel> {
    const result = await this.prisma.test.delete({
      where: { id },
    })
    return result as TestModel
  }

  async findTestByName(name: string): Promise<TestModel | null> {
    const result = await this.prisma.test.findUnique({
      where: { name },
    })
    return result as TestModel | null
  }

  async searchTests(query: string): Promise<TestModel[]> {
    const result = await this.prisma.test.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })
    return result as TestModel[]
  }
}
