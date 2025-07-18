import { Injectable } from '@nestjs/common'
import { TestResult, Prisma, TestInterpretation } from '@prisma/client'
import { PrismaService } from '../shared/services/prisma.service'
import { PaginationService } from '../shared/services/pagination.service'
import { CreateTestResultDto, UpdateTestResultDto } from '../routes/test-result/test-result.dto'
import { TestResultFilterSchema, TestResultQuery } from '../routes/test-result/test-result.model'
import { TestResultCreateData, TestResultUpdateData } from '../shared/interfaces/test-result.interface'
import { PaginatedResponse, PaginationOptions } from '../shared/schemas/pagination.schema'
import { createPaginationSchema } from '../shared/schemas/pagination.schema'

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
    return await this.prisma.testResult.create({
      data: createData,
      include: {
        test: true,
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        patientTreatment: true,
        labTech: { select: { id: true, name: true } },
      },
    })
  }

  async create(data: TestResultCreateData): Promise<TestResult> {
    const createData = {
      ...data,
      interpretation: data.interpretation || TestInterpretation.NOT_DETECTED,
      // Don't set resultDate on create - it will be set during update
    }

    return await this.prisma.testResult.create({
      data: createData,
      include: {
        test: true,
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        patientTreatment: true,
        labTech: true,
      },
    })
  }

  async findMany(options: PaginationOptions<any>): Promise<PaginatedResponse<TestResult> & { total: number }> {
    // Validate options similar to blog repository
    const validatedOptions = {
      page: options.page || 1,
      limit: options.limit || 10,
      sortBy: options.sortBy || 'resultDate',
      sortOrder: options.sortOrder || 'desc',
      search: options.search,
      searchFields: options.searchFields || ['interpretation'],
      filters: options.filters,
    }

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
    const paginatedResponse = await this.paginationService.paginate<TestResult>(
      this.prisma.testResult,
      validatedOptions,
      where,
      {
        test: true,
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        labTech: { select: { id: true, name: true } },
      },
    )

    return { ...paginatedResponse, total }
  }

  async findTestResultsPaginated(options: PaginationOptions<any>): Promise<PaginatedResponse<TestResult>> {
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

    if (validatedOptions.search) {
      where.OR = [
        { test: { name: { contains: validatedOptions.search, mode: 'insensitive' } } },
        { user: { name: { contains: validatedOptions.search, mode: 'insensitive' } } },
        { notes: { contains: validatedOptions.search, mode: 'insensitive' } },
      ]
    }

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
      appointment: true,
      labTech: true,
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
        labTech: { select: { id: true, name: true } },
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
        labTech: { select: { id: true, name: true } },
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

  async findByUserId(userId: number): Promise<TestResult[]> {
    return await this.prisma.testResult.findMany({
      where: { userId },
      include: {
        test: true,
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        patientTreatment: true,
        labTech: { select: { id: true, name: true } },
      },
      orderBy: { resultDate: 'desc' },
    })
  }

  async findByPatientTreatmentId(patientTreatmentId: number): Promise<TestResult[]> {
    return await this.prisma.testResult.findMany({
      where: { patientTreatmentId },
      include: {
        test: true,
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        patientTreatment: true,
        labTech: { select: { id: true, name: true } },
      },
      orderBy: { resultDate: 'desc' },
    })
  }

  async findByLabTechId(labTechId: number): Promise<TestResult[]> {
    return await this.prisma.testResult.findMany({
      where: { labTechId },
      include: {
        test: true,
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        patientTreatment: true,
        labTech: { select: { id: true, name: true } },
      },
      orderBy: { resultDate: 'desc' },
    })
  }

  async findByNullLabTechId(options: PaginationOptions<any>): Promise<PaginatedResponse<TestResult>> {
    const where: Prisma.TestResultWhereInput = { labTechId: null }
    return this.paginationService.paginate(this.prisma.testResult, options, where, {
      test: true,
      user: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
      patientTreatment: true,
      labTech: { select: { id: true, name: true } },
    })
  }

  async findByStatus(status: string, options: PaginationOptions<any>): Promise<PaginatedResponse<TestResult>> {
    const where: Prisma.TestResultWhereInput = { status }
    return this.paginationService.paginate(this.prisma.testResult, options, where, {
      test: true,
      user: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
      patientTreatment: true,
      labTech: { select: { id: true, name: true } },
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
        labTech: { select: { id: true, name: true } },
      },
      orderBy: { resultDate: 'desc' },
    })
    return result
  }
}
