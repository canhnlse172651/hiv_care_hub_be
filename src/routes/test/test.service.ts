import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { TestRepository } from '../../repositories/test.repository'
import { CreateTestDtoType, UpdateTestDtoType } from './test.dto'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { PaginationService } from '../../shared/services/pagination.service'
import { TestQuery } from '../../shared/interfaces/query.interface'

// Use the same type as repository
type TestModel = {
  id: number
  name: string
  description: string | null
  method: string | null
  category: string | null
  isQuantitative: boolean
  unit: string | null
  cutOffValue: any
  price: any
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class TestService {
  constructor(
    private readonly testRepository: TestRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createTest(data: CreateTestDtoType): Promise<TestModel> {
    // Check if test with same name already exists
    const existingTest = await this.testRepository.findTestByName(data.name)
    if (existingTest) {
      throw new BadRequestException('Test with this name already exists')
    }

    return await this.testRepository.createTest(data)
  }

  async getTestById(id: number): Promise<TestModel> {
    const test = await this.testRepository.findTestById(id)
    if (!test) {
      throw new NotFoundException('Test not found')
    }
    return test
  }

  async findTestsPaginated(query: TestQuery): Promise<PaginatedResponse<TestModel>> {
    return await this.testRepository.findTestsPaginated({
      page: query.page || 1,
      limit: query.limit || 10,
      search: query.search,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
      filters: query.filters,
    })
  }

  async updateTest(id: number, data: UpdateTestDtoType): Promise<TestModel> {
    const existingTest = await this.testRepository.findTestById(id)
    if (!existingTest) {
      throw new NotFoundException('Test not found')
    }

    // Check if trying to update name to an existing name
    if (data.name && data.name !== existingTest.name) {
      const testWithSameName = await this.testRepository.findTestByName(data.name)
      if (testWithSameName) {
        throw new BadRequestException('Test with this name already exists')
      }
    }

    return await this.testRepository.updateTest(id, data)
  }

  async deleteTest(id: number): Promise<TestModel> {
    const existingTest = await this.testRepository.findTestById(id)
    if (!existingTest) {
      throw new NotFoundException('Test not found')
    }

    return await this.testRepository.deleteTest(id)
  }
}
