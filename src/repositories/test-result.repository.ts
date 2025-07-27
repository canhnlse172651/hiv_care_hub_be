import { BadRequestException, Injectable } from '@nestjs/common'
import { TestResult, Prisma, TestInterpretation } from '@prisma/client'
import { PrismaService } from '../shared/services/prisma.service'
import { PaginationService } from '../shared/services/pagination.service'
import { CreateTestResultDto, UpdateTestResultDto } from '../routes/test-result/test-result.dto'
import { TestResultFilterSchema, TestResultQuery } from '../routes/test-result/test-result.model'
import { TestResultCreateData, TestResultUpdateData } from '../shared/interfaces/test-result.interface'
import { PaginatedResponse, PaginationOptions } from '../shared/schemas/pagination.schema'
import { createPaginationSchema } from '../shared/schemas/pagination.schema'
import { PaginationQuery } from 'src/shared/interfaces/query.interface'

@Injectable()
export class TestResultRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  // Get model for pagination - similar to blog repository
  getTestResultModel(): typeof this.prisma.testResult {
    return this.prisma.testResult
  }

  async createTestResult(data: TestResultCreateData): Promise<TestResult> {
    const createData = {
      ...data,
      interpretation: data.interpretation || TestInterpretation.NOT_DETECTED,
      // resultDate will be null on creation, set only during update
    }

    // Validate testId
    const testExists = await this.prisma.test.findUnique({ where: { id: data.testId } })
    if (!testExists) {
      throw new BadRequestException(`Không tìm thấy xét nghiệm.`)
    }

    // Validate userId
    const userExists = await this.prisma.user.findUnique({ where: { id: data.userId } })
    if (!userExists) {
      throw new BadRequestException(`Không tìm thấy người dùng.`)
    }

    // Validate patientTreatmentId
    const patientTreatmentExists = await this.prisma.patientTreatment.findUnique({
      where: { id: data.patientTreatmentId },
    })
    if (!patientTreatmentExists) {
      throw new BadRequestException(`Không tìm thấy điều trị bệnh nhân.`)
    }
    if (data.userId !== patientTreatmentExists.patientId) {
      throw new BadRequestException(`Không khớp người dùng với điều trị bệnh nhân.`)
    }

    try {
      return await this.prisma.testResult.create({
        data: createData,
        include: {
          test: true,
          user: {
            select: { id: true, name: true, email: true, phoneNumber: true },
          },
          patientTreatment: true,
          labTech: { select: { id: true, name: true, email: true, phoneNumber: true } },
        },
      })
    } catch (error) {
      console.error('Error creating test result:', error.message, error.stack)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error code:', error.code)
      }
      throw new Error('Failed to create test result')
    }
  }

  async findMany(options: PaginationOptions<any>): Promise<PaginatedResponse<TestResult>> {
    // Validate options similar to blog repository
    const paginationSchema = createPaginationSchema(TestResultFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields || ['interpretation'],
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: Prisma.TestResultWhereInput = {}

    // Search functionality
    if (validatedOptions.search) {
      where.OR = [
        { test: { name: { contains: validatedOptions.search, mode: 'insensitive' } } },
        { user: { name: { contains: validatedOptions.search, mode: 'insensitive' } } },
        { notes: { contains: validatedOptions.search, mode: 'insensitive' } },
      ]
    }

    // Filter functionality
    if (validatedOptions.filters) {
      const { userId, testId, patientTreatmentId, interpretation, dateFrom, dateTo, labTechId } =
        validatedOptions.filters

      if (userId) where.userId = userId
      if (testId) where.testId = testId
      if (patientTreatmentId) where.patientTreatmentId = patientTreatmentId
      if (interpretation) where.interpretation = interpretation
      if (labTechId) where.labTechId = labTechId

      if (dateFrom || dateTo) {
        where.resultDate = {}
        if (dateFrom) where.resultDate.gte = new Date(dateFrom as string)
        if (dateTo) where.resultDate.lte = new Date(dateTo as string)
      }
    }

    // Calculate total count
    const total = await this.prisma.testResult.count({ where })

    // Use pagination service like blog repository
    return this.paginationService.paginate(this.prisma.testResult, validatedOptions, where, {
      test: true,
      user: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
      patientTreatment: true,
      labTech: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
    })
  }

  async findTestResultsPaginated(options: PaginationOptions<PaginationQuery>): Promise<PaginatedResponse<TestResult>> {
    const paginationSchema = createPaginationSchema(TestResultFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: Prisma.TestResultWhereInput = {}

    const orderBy: any = {}
    if (validatedOptions.sortBy && validatedOptions.sortOrder) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.resultDate = 'desc'
    }

    return this.paginationService.paginate(this.prisma.testResult, validatedOptions, where, {
      test: true,
      user: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
      patientTreatment: true,
      labTech: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
    })
  }

  async findById(id: number): Promise<TestResult | null> {
    const result = await this.prisma.testResult.findUnique({
      where: { id },
      include: {
        test: true,
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        patientTreatment: true,
        labTech: { select: { id: true, name: true, email: true, phoneNumber: true } },
      },
    })
    if (!result) {
      throw new Error(`Không tìm thấy kết quả xét nghiệm với ID ${id}`)
    }
    return result
  }

  async update(id: number, data: TestResultUpdateData): Promise<TestResult> {
    const updateData: Prisma.TestResultUpdateInput = { ...data }

    if (data.resultDate) {
      updateData.resultDate = new Date(data.resultDate)
    }

    return await this.prisma.testResult.update({
      where: { id },
      data: updateData,
      include: {
        test: true,
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        patientTreatment: true,
        labTech: { select: { id: true, name: true, email: true, phoneNumber: true } },
      },
    })
  }

  async delete(id: number): Promise<TestResult> {
    const result = await this.prisma.testResult.findUnique({ where: { id } })
    if (!result) {
      throw new Error(`Không tìm thấy kết quả xét nghiệm với ID ${id}`)
    }
    return await this.prisma.testResult.delete({
      where: { id },
    })
  }

  async findByUserId(
    userId: number,
    options: PaginationOptions<PaginationQuery>,
  ): Promise<PaginatedResponse<TestResult>> {
    const paginationSchema = createPaginationSchema(TestResultFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: Prisma.TestResultWhereInput = { userId }

    const orderBy: any = {}
    if (validatedOptions.sortBy && validatedOptions.sortOrder) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.resultDate = 'desc'
    }
    return this.paginationService.paginate(this.prisma.testResult, validatedOptions, where, {
      test: true,
      user: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
      patientTreatment: true,
      labTech: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
    })
  }

  async findByPatientTreatmentId(
    patientTreatmentId: number,
    options: PaginationOptions<PaginationQuery>,
  ): Promise<PaginatedResponse<TestResult>> {
    const paginationSchema = createPaginationSchema(TestResultFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: Prisma.TestResultWhereInput = { patientTreatmentId }

    const orderBy: any = {}
    if (validatedOptions.sortBy && validatedOptions.sortOrder) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.resultDate = 'desc'
    }
    return this.paginationService.paginate(this.prisma.testResult, validatedOptions, where, {
      test: true,
      user: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
      patientTreatment: true,
      labTech: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
    })
  }

  async findByLabTechId(
    labTechId: number,
    options: PaginationOptions<PaginationQuery>,
  ): Promise<PaginatedResponse<TestResult>> {
    const paginationSchema = createPaginationSchema(TestResultFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: Prisma.TestResultWhereInput = { labTechId }

    const orderBy: any = {}
    if (validatedOptions.sortBy && validatedOptions.sortOrder) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.resultDate = 'desc'
    }
    return this.paginationService.paginate(this.prisma.testResult, validatedOptions, where, {
      test: true,
      user: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
      patientTreatment: true,
      labTech: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
    })
  }

  async findByStatus(
    status: string,
    options: PaginationOptions<PaginationQuery>,
  ): Promise<PaginatedResponse<TestResult>> {
    const paginationSchema = createPaginationSchema(TestResultFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: Prisma.TestResultWhereInput = { status }

    const orderBy: any = {}
    if (validatedOptions.sortBy && validatedOptions.sortOrder) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.resultDate = 'desc'
    }
    return this.paginationService.paginate(this.prisma.testResult, validatedOptions, where, {
      test: true,
      user: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
      patientTreatment: true,
      labTech: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
    })
  }

  async searchTestResults(query: string): Promise<TestResult[]> {
    const result = await this.prisma.testResult.findMany({
      where: {
        OR: [
          { test: { name: { contains: query, mode: 'insensitive' } } },
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { notes: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        test: true,
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        patientTreatment: true,
        labTech: { select: { id: true, name: true, email: true, phoneNumber: true } },
      },
      orderBy: { resultDate: 'desc' },
    })
    return result
  }
}
