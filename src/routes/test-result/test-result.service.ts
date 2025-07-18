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

@Injectable()
export class TestResultService {
  constructor(
    private readonly testResultRepository: TestResultRepository,
    private readonly testRepository: TestRepository,
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
      throw new NotFoundException(`Không tìm thấy bài kiểm tra với ID ${data.testId}`)
    }

    // Tạo TestResult với status "Processing"
    const testResultData: TestResultCreateData = {
      testId: data.testId,
      userId: data.userId,
      patientTreatmentId: data.patientTreatmentId,
      rawResultValue: null,
      interpretation: TestInterpretation.NOT_DETECTED, // Mặc định là NOT_DETECTED
      cutOffValueUsed: null,
      labTechId: null,
      resultDate: null, // Explicitly set to null on creation
      notes: data.notes || null,
      status: 'Processing',
      createdByDoctorId: doctorId || null, // Set doctorId if provided
    }

    console.log('testResultData', testResultData)
    return await this.testResultRepository.createTestResult(testResultData)
  }

  /**
   * Lấy danh sách TestResult với phân trang
   */
  async findTestResults(query: TestResultQuery): Promise<{ data: TestResult[]; total: number }> {
    return await this.testResultRepository.findMany(query)
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

    await this.testResultRepository.delete(id)
  }

  /**
   * Lấy TestResult theo User ID
   */
  async findTestResultsByUserId(userId: number): Promise<TestResult[]> {
    return await this.testResultRepository.findByUserId(userId)
  }

  /**
   * Lấy TestResult theo PatientTreatment ID
   */
  async findTestResultsByPatientTreatmentId(patientTreatmentId: number): Promise<TestResult[]> {
    return await this.testResultRepository.findByPatientTreatmentId(patientTreatmentId)
  }

  /**
   * Lấy TestResult theo Lab Tech ID (do lab tech nhập)
   */
  async findTestResultsByLabTechId(labTechId: number): Promise<TestResult[]> {
    return await this.testResultRepository.findByLabTechId(labTechId)
  }

  /**
   * Lấy TestResult với null Lab Tech ID
   */
  async findTestResultsByNullLabTechId(query: TestResultQuery): Promise<{ data: TestResult[]; total: number }> {
    const result = await this.testResultRepository.findByNullLabTechId(query)
    return {
      data: result.data,
      total: result.meta.total,
    }
  }

  /**
   * Lấy TestResult theo Status
   */
  async findTestResultsByStatus(
    status: string,
    query: TestResultQuery,
  ): Promise<{ data: TestResult[]; total: number }> {
    const result = await this.testResultRepository.findByStatus(status, query)
    return {
      data: result.data,
      total: result.meta.total,
    }
  }
}
