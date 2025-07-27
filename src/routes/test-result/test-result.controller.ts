import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { TestResultService } from './test-result.service'
import { CreateTestResultDto, UpdateTestResultDto, TestResultQueryDto } from './test-result.dto'
import { AuthenticationGuard } from '../../shared/guards/authentication.guard'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from 'src/shared/constants/role.constant'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import {
  ApiCreateTestResult,
  ApiUpdateTestResult,
  ApiGetTestResultsByStatus,
  ApiGetTestResults,
  ApiGetTestResultById,
} from 'src/swagger/test-result.swagger'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { TokenPayload } from 'src/shared/types/jwt.type'
import { PaginationQuery } from 'src/shared/interfaces/query.interface'

@ApiBearerAuth()
@ApiTags('Test-results')
@Controller('test-results')
@UseGuards(AuthenticationGuard, RolesGuard)
@Auth([AuthType.Bearer])
export class TestResultController {
  constructor(private readonly testResultService: TestResultService) {}

  @Post()
  @Roles(Role.Doctor)
  @ApiOperation({
    summary: 'Tạo yêu cầu xét nghiệm mới',
    description: `Chỉ bác sĩ (DOCTOR) có thể tạo yêu cầu xét nghiệm mới.   
Flow hoạt động:
1. Bác sĩ tạo yêu cầu xét nghiệm với thông tin cơ bản:
   - testId: ID của loại xét nghiệm
   - userId: ID của bệnh nhân
   - patientTreatmentId: ID của đợt điều trị
   - notes: Ghi chú (tùy chọn)
   
2. Hệ thống tự động tạo test result với:
   - status: "Processing"
   - rawResultValue: null
   - interpretation: null
   - cutOffValueUsed: null
   - labTechId: null
   - resultDate: null
   
3. Sau đó staff/bác sĩ sẽ cập nhật kết quả thực tế thông qua API update`,
  })
  @ApiCreateTestResult()
  async createTestResult(@ActiveUser() user: TokenPayload, @Body() createTestResultDto: CreateTestResultDto) {
    console.log('createTestResult called with user:', createTestResultDto)
    return this.testResultService.createTestResult(createTestResultDto, user.userId)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTestResults()
  async getTestResults(@Query() query: PaginationQuery) {
    return this.testResultService.findTestResults(query)
  }

  @Get('user/:userId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  async getTestResultsByUserId(@Param('userId', ParseIntPipe) userId: number, @Query() query: PaginationQuery) {
    return this.testResultService.findTestResultsByUserId(userId, query)
  }

  @Get('patient-treatment/:patientTreatmentId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Lấy kết quả xét nghiệm theo PatientTreatment ID',
    description: 'Lấy tất cả kết quả xét nghiệm của một đợt điều trị bệnh nhân',
  })
  async getTestResultsByPatientTreatmentId(
    @Param('patientTreatmentId', ParseIntPipe) patientTreatmentId: number,
    @Query() query: PaginationQuery,
  ) {
    return this.testResultService.findTestResultsByPatientTreatmentId(patientTreatmentId, query)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTestResultById()
  async getTestResultById(@Param('id', ParseIntPipe) id: number) {
    return this.testResultService.findTestResultById(id)
  }

  @Put(':id')
  @Roles(Role.Staff, Role.Doctor)
  @ApiUpdateTestResult()
  async updateTestResult(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: TokenPayload,
    @Body() updateTestResultDto: UpdateTestResultDto,
  ) {
    return this.testResultService.updateTestResult(id, updateTestResultDto, user.userId)
  }

  @Get('status/:status')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTestResultsByStatus()
  async getTestResultsByStatus(@Param('status') status: string, @Query() query: PaginationQuery) {
    return this.testResultService.findTestResultsByStatus(status, query)
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Staff, Role.Doctor)
  @ApiOperation({
    summary: 'Xóa kết quả xét nghiệm',
    description: 'Chỉ admin và nhân viên có thể xóa kết quả xét nghiệm',
  })
  
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async deleteTestResult(@Param('id', ParseIntPipe) id: number) {
    await this.testResultService.deleteTestResult(id)
    return { message: 'Test result deleted successfully' }
  }
}
