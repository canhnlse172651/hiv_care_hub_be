import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { TestResultService } from './test-result.service'
import { CreateTestResultDto, UpdateTestResultDto, TestResultQueryDto } from './test-result.dto'
import { AuthenticationGuard } from '../../shared/guards/authentication.guard'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from 'src/shared/constants/role.constant'
import { User } from '@prisma/client'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ApiCreateTestResult } from 'src/swagger/test-result.swagger'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { TokenPayload } from 'src/shared/types/jwt.type'

@ApiBearerAuth()
@ApiTags('Test-results')
@Controller('test-results')
@UseGuards(AuthenticationGuard, RolesGuard)
@Auth([AuthType.Bearer])
export class TestResultController {
  constructor(private readonly testResultService: TestResultService) {}

  @Post()
  @Roles(Role.Staff)
  @ApiOperation({
    summary: 'Tạo kết quả xét nghiệm mới',
    description: `Chỉ nhân viên (STAFF) có thể nhập kết quả xét nghiệm.
Quy tắc xử lý theo Category:

1. STD (Sexually Transmitted Diseases):
   - Định tính (HIV, Syphilis):
     + rawResultValue: tỉ lệ phản ứng (0.0 - 10.0)
     + cutOffValue: thường là 1.0
     + interpretation: POSITIVE nếu rawResultValue >= cutOffValue
   
2. HEPATITIS (Viêm gan):
   - Định tính (HBsAg, Anti-HCV):
     + rawResultValue: chỉ số S/CO (0.0 - 1000.0)
     + cutOffValue: thường là 1.0
     + interpretation: POSITIVE nếu rawResultValue >= cutOffValue

3. IMMUNOLOGY (Miễn dịch):
   - CD4 (Định lượng):
     + rawResultValue: số tế bào/μL (0 - 2000)
     + cutOffValue: 200 cells/μL
     + interpretation: 
       * DETECTED nếu rawResultValue >= cutOffValue
       * NOT_DETECTED nếu rawResultValue < cutOffValue
   - HIV Viral Load (Định lượng):
     + rawResultValue: copies/mL (20 - 10,000,000)
     + cutOffValue: 20 copies/mL (ngưỡng phát hiện)
     + interpretation:
       * DETECTED nếu rawResultValue >= cutOffValue
       * NOT_DETECTED nếu rawResultValue < cutOffValue

4. GENERAL (Xét nghiệm cơ bản):
   - Các chỉ số máu, sinh hóa (Định lượng):
     + rawResultValue: theo đơn vị tương ứng
     + cutOffValue: giá trị tham chiếu
     + interpretation: dựa vào khoảng tham chiếu

Lưu ý quan trọng:
- Hệ thống tự động lấy thông tin unit và cutOffValue từ bảng Test
- Khi rawResultValue gần với cutOffValue (±10%), có thể cân nhắc kết quả INDETERMINATE
- Mỗi test trong một appointment phải là duy nhất (không thể tạo 2 kết quả cho cùng 1 loại test)`,
  })
  @ApiCreateTestResult()
  async createTestResult(@ActiveUser() user: TokenPayload, @Body() createTestResultDto: CreateTestResultDto) {
    return this.testResultService.createTestResult(createTestResultDto, user.userId)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Lấy danh sách kết quả xét nghiệm',
    description: 'Lấy danh sách kết quả xét nghiệm có phân trang và filter',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getTestResults(@Query() query: TestResultQueryDto) {
    return this.testResultService.findTestResults(query)
  }

  @Get('user/:userId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Lấy kết quả xét nghiệm theo User ID',
    description: 'Lấy tất cả kết quả xét nghiệm của một bệnh nhân',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getTestResultsByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.testResultService.findTestResultsByUserId(userId)
  }

  @Get('patient-treatment/:patientTreatmentId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Lấy kết quả xét nghiệm theo PatientTreatment ID',
    description: 'Lấy tất cả kết quả xét nghiệm của một đợt điều trị bệnh nhân',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getTestResultsByPatientTreatmentId(@Param('patientTreatmentId', ParseIntPipe) patientTreatmentId: number) {
    return this.testResultService.findTestResultsByPatientTreatmentId(patientTreatmentId)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Lấy kết quả xét nghiệm theo ID',
    description: 'Lấy chi tiết một kết quả xét nghiệm',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async getTestResultById(@Param('id', ParseIntPipe) id: number) {
    return this.testResultService.findTestResultById(id)
  }

  @Put(':id')
  @Roles(Role.Staff)
  @ApiOperation({
    summary: 'Cập nhật kết quả xét nghiệm',
    description:
      'Chỉ nhân viên có thể cập nhật kết quả xét nghiệm. Nếu cập nhật rawResultValue, hệ thống sẽ tự động tính toán lại interpretation.',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async updateTestResult(@Param('id', ParseIntPipe) id: number, @Body() updateTestResultDto: UpdateTestResultDto) {
    return this.testResultService.updateTestResult(id, updateTestResultDto)
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Staff)
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
