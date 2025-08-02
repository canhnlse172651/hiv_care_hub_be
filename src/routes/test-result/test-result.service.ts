import { Injectable, NotFoundException } from '@nestjs/common'
import { TestResult, TestInterpretation, Prisma } from '@prisma/client'
import { TestResultRepository } from '../../repositories/test-result.repository'
import { TestRepository } from '../../repositories/test.repository'
import { CreateTestResultDto, UpdateTestResultDto } from './test-result.dto'
import { TestResultQuery } from './test-result.model'
import {
  TestWithQuantitativeInfo,
  TestResultCreateData,
  TestResultUpdateData,
} from '../../shared/interfaces/test-result.interface'
import { PaginatedResponse } from 'src/shared/schemas/pagination.schema'
import { PaginationQuery } from 'src/shared/interfaces/query.interface'
import { DoctorService } from '../doctor/doctor.service'

@Injectable()
export class TestResultService {
  constructor(
    private readonly testResultRepository: TestResultRepository,
    private readonly testRepository: TestRepository,
    private readonly doctorService: DoctorService,
  ) {}

  /**
   * Tính toán interpretation tự động dựa trên Test và rawResultValue
   */
  private calculateInterpretation(test: TestWithQuantitativeInfo, rawResultValue: number): TestInterpretation {
    // Nếu Test.isQuantitative là false (định tính)
    if (!test.isQuantitative) {
      // Nếu rawResultValue dưới 0.5 thì NEGATIVE, ngược lại POSITIVE
      return rawResultValue < 0.5 ? TestInterpretation.NEGATIVE : TestInterpretation.POSITIVE
    }

    // Nếu Test.isQuantitative là true (định lượng)
    if (test.cutOffValue) {
      // Nếu rawResultValue dưới cutOffValue thì NOT_DETECTED, ngược lại DETECTED
      const cutOffNumber =
        test.cutOffValue instanceof Prisma.Decimal
          ? parseFloat(test.cutOffValue.toString())
          : typeof test.cutOffValue === 'string'
            ? parseFloat(test.cutOffValue)
            : test.cutOffValue

      return rawResultValue < cutOffNumber ? TestInterpretation.NOT_DETECTED : TestInterpretation.DETECTED
    }

    // Nếu không có cutOffValue, mặc định là INDETERMINATE
    return TestInterpretation.INDETERMINATE
  }

  /**
   * Tạo mới TestResult với status "Processing"
   */
  async createTestResult(data: CreateTestResultDto, doctorId: number): Promise<TestResult> {
    // Kiểm tra Test có tồn tại không
    const test = await this.testRepository.findTestById(data.testId)
    if (!test) {
      throw new NotFoundException(`Không tìm thấy xét nghiệm với ID ${data.testId}`)
    }

    // Kiểm tra Doctor có tồn tại không
    const doctor = await this.doctorService.findDoctorByUserId(doctorId)
    if (!doctor) {
      throw new NotFoundException(`Không tìm thấy bác sĩ với User ID ${doctorId}`)
    }

    // Tạo TestResult với status "Processing"
    const testResultData: TestResultCreateData = {
      testId: data.testId,
      userId: data.userId,
      patientTreatmentId: data.patientTreatmentId,
      rawResultValue: null,
      interpretation: TestInterpretation.NOT_DETECTED, // Mặc định là NOT_DETECTED
      cutOffValueUsed: null,
      unit: test.unit || null, // Sử dụng unit từ Test
      labTechId: null,
      resultDate: null, // Explicitly set to null on creations
      notes: data.notes || null,
      status: 'Processing',
      createdByDoctorId: doctor.id || null, // Set doctorId if provided
    }
    return await this.testResultRepository.createTestResult(testResultData)
  }

  /**
   * Lấy danh sách TestResult với phân trang
   */
  async findTestResults(query: PaginationQuery): Promise<PaginatedResponse<TestResult>> {
    const paginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'resultDate',
      sortOrder: query.sortOrder || 'desc',
    }

    return await this.testResultRepository.findTestResultsPaginated(paginationOptions)
  }

  /**
   * Lấy TestResult theo ID
   */
  async findTestResultById(id: number): Promise<TestResult> {
    const testResult = await this.testResultRepository.findById(id)
    if (!testResult) {
      throw new NotFoundException(`Không tìm thấy kết quả xét nghiệm với ID ${id}`)
    }
    return testResult
  }

  /**
   * Cập nhật TestResult với kết quả xét nghiệm
   */
  async updateTestResult(id: number, data: UpdateTestResultDto, userId: number): Promise<TestResult> {
    const existingTestResult = await this.testResultRepository.findById(id)
    if (!existingTestResult) {
      throw new NotFoundException(`Không tìm thấy kết quả xét nghiệm với ID ${id}`)
    }

    // Tạo object cập nhật
    const updateData: TestResultUpdateData = {
      notes: data.notes,
      resultDate: data.resultDate ? new Date(data.resultDate) : undefined,
      status: data.status,
      labTechId: userId,
    }

    // Nếu có rawResultValue, tính toán interpretation tự động
    if (data.rawResultValue !== undefined) {
      const test = await this.testRepository.findTestById(existingTestResult.testId)
      if (test) {
        // Cast test to proper type for calculation
        const testInfo: TestWithQuantitativeInfo = {
          id: test.id,
          name: test.name,
          isQuantitative: test.isQuantitative ?? false,
          cutOffValue: test.cutOffValue ?? null,
          unit: test.unit ?? null,
          category: test.category ?? null,
          description: test.description ?? null,
        }

        updateData.interpretation = this.calculateInterpretation(testInfo, data.rawResultValue)
        updateData.cutOffValueUsed = test.cutOffValue ?? null
        updateData.rawResultValue = new Prisma.Decimal(data.rawResultValue)
        updateData.resultDate = new Date() // Always set resultDate when entering result
        updateData.status = 'Completed' // Automatically change status to Completed
      }
    }

    return await this.testResultRepository.update(id, updateData)
  }

  /**
   * Xóa TestResult
   */
  async deleteTestResult(id: number): Promise<void> {
    const testResult = await this.testResultRepository.findById(id)
    if (!testResult) {
      throw new NotFoundException(`Không tìm thấy kết quả xét nghiệm với ID ${id}`)
    }
    if (testResult.status !== 'Processing') {
      throw new Error('Chỉ có thể xóa kết quả xét nghiệm đang trong trạng thái "Processing"')
    }
    await this.testResultRepository.delete(id)
  }

  /**
   * Lấy TestResult theo User ID
   */
  async findTestResultsByUserId(userId: number, query: PaginationQuery): Promise<PaginatedResponse<TestResult>> {
    const paginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'resultDate',
      sortOrder: query.sortOrder || 'desc',
    }
    return await this.testResultRepository.findByUserId(userId, paginationOptions)
  }

  /**
   * Lấy TestResult theo PatientTreatment ID
   */
  async findTestResultsByPatientTreatmentId(
    patientTreatmentId: number,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<TestResult>> {
    const paginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'resultDate',
      sortOrder: query.sortOrder || 'desc',
    }
    return await this.testResultRepository.findByPatientTreatmentId(patientTreatmentId, paginationOptions)
  }

  /**
   * Lấy TestResult theo Lab Tech ID (do lab tech nhập)
   */
  async findTestResultsByLabTechId(labTechId: number, query: PaginationQuery): Promise<PaginatedResponse<TestResult>> {
    const paginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'resultDate',
      sortOrder: query.sortOrder || 'desc',
    }
    return await this.testResultRepository.findByLabTechId(labTechId, paginationOptions)
  }

  /**
   * Lấy TestResult theo Status
   */
  async findTestResultsByStatus(status: string, query: PaginationQuery): Promise<PaginatedResponse<TestResult>> {
    const paginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'resultDate',
      sortOrder: query.sortOrder || 'desc',
    }
    return await this.testResultRepository.findByStatus(status, paginationOptions)
  }
}
