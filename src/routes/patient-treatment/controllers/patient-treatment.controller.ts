import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PatientTreatment } from '@prisma/client'
import CustomZodValidationPipe from 'src/common/custom-zod-validate'
import {
  TreatmentComplianceStatsDto,
  TreatmentCostAnalysisDto,
} from 'src/routes/patient-treatment/patient-treatment.analytics.dto'
import {
  CreatePatientTreatmentDto,
  CreatePatientTreatmentDtoType,
  PatientTreatmentQueryDto,
} from 'src/routes/patient-treatment/patient-treatment.dto'
import { PatientTreatmentService } from 'src/routes/patient-treatment/patient-treatment.service'
import { AuthType } from 'src/shared/constants/auth.constant'
import { Role } from 'src/shared/constants/role.constant'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { PaginatedResponse } from 'src/shared/schemas/pagination.schema'
import {
  ApiCompareProtocolVsCustomTreatments,
  ApiCreatePatientTreatment,
  ApiEndActivePatientTreatments,
  ApiGetActivePatientTreatments,
  ApiGetActivePatientTreatmentsByPatient,
  ApiGetAllPatientTreatments,
  ApiGetCustomMedicationStats,
  ApiGetDoctorWorkloadStats,
  ApiGetPatientTreatmentById,
  ApiGetPatientTreatmentsByDateRange,
  ApiGetPatientTreatmentsByDoctor,
  ApiGetPatientTreatmentsByPatient,
  ApiGetPatientTreatmentStats,
  ApiGetTreatmentComplianceStats,
  ApiGetTreatmentCostAnalysis,
  ApiGetTreatmentsWithCustomMedications,
  ApiSearchPatientTreatments,
} from 'src/swagger/patient-treatment.swagger'

@ApiBearerAuth()
@ApiTags('Patient Treatment Management')
@Controller('patient-treatments')
@Auth([AuthType.Bearer])
export class PatientTreatmentController {
  constructor(private readonly patientTreatmentService: PatientTreatmentService) {}

  // ===============================
  // CRUD Endpoints
  // ===============================

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreatePatientTreatment()
  async createPatientTreatment(
    @Body(new CustomZodValidationPipe(CreatePatientTreatmentDto)) data: CreatePatientTreatmentDtoType,
    @CurrentUser() user: { userId?: number; id?: number },
    @Query('autoEndExisting') autoEndExisting?: string,
  ): Promise<PatientTreatment> {
    const userId = user.userId ?? user.id
    const result = await this.patientTreatmentService.createPatientTreatment(
      data,
      Number(userId),
      autoEndExisting === 'true',
    )
    // Ensure type safety
    if (!result || typeof result !== 'object') throw new InternalServerErrorException('Unexpected result')
    return result as PatientTreatment
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetAllPatientTreatments()
  async getAllPatientTreatments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const result = await this.patientTreatmentService.getAllPatientTreatments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      startDate,
      endDate,
    })
    return result
  }

  // ===============================
  // Dynamic Endpoints
  // ===============================

  @Get('patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentsByPatient()
  async getPatientTreatmentsByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: { userId?: number; id?: number; role?: { name?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeCompleted') includeCompleted?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const userId = user.userId ?? user.id
    if (user.role?.name === 'PATIENT' && Number(userId) !== patientId) {
      throw new ForbiddenException('Patients can only access their own treatment records')
    }
    const result = await this.patientTreatmentService.getPatientTreatmentsByPatientId({
      patientId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      includeCompleted: includeCompleted === 'true' || includeCompleted === undefined,
      startDate,
      endDate,
    })
    return result
  }

  @Get('doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetPatientTreatmentsByDoctor()
  async getPatientTreatmentsByDoctor(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const result = await this.patientTreatmentService.getPatientTreatmentsByDoctorId({
      doctorId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    })
    return result
  }

  // ===============================
  // SEARCH AND ADVANCED QUERIES
  // ===============================

  @Get('search')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiSearchPatientTreatments()
  async searchPatientTreatments(
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const searchQuery = search || q || query || ''
    const pageNum = page ? Number(page) : 1
    const limitNum = limit ? Number(limit) : 10
    const result = await this.patientTreatmentService.searchPatientTreatments(searchQuery, pageNum, limitNum)
    return result
  }

  @Get('date-range')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetPatientTreatmentsByDateRange()
  async getPatientTreatmentsByDateRange(
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ): Promise<PatientTreatment[]> {
    const startDate = startDateStr ? new Date(startDateStr) : new Date()
    const endDate = endDateStr ? new Date(endDateStr) : new Date()
    const result = await this.patientTreatmentService.getPatientTreatmentsByDateRange(startDate, endDate)
    return result
  }

  @Get('active')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetActivePatientTreatments()
  async getActivePatientTreatments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('protocolId') protocolId?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const result = await this.patientTreatmentService.getActivePatientTreatments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      patientId: patientId ? Number(patientId) : undefined,
      doctorId: doctorId ? Number(doctorId) : undefined,
      protocolId: protocolId ? Number(protocolId) : undefined,
    })
    return result
  }

  @Get('active/patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetActivePatientTreatmentsByPatient()
  async getActivePatientTreatmentsByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
  ): Promise<PatientTreatment[]> {
    const result = await this.patientTreatmentService.getActivePatientTreatmentsByPatient(patientId)
    return result as PatientTreatment[]
  }

  @Get('custom-medications')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentsWithCustomMedications()
  async getTreatmentsWithCustomMedications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('hasCustomMeds') hasCustomMeds?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const result = await this.patientTreatmentService.findTreatmentsWithCustomMedications({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      hasCustomMeds: hasCustomMeds === 'true',
    })
    return result
  }

  // ===============================
  // Analytics & Stats
  // ===============================

  @Get('stats/patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentStats()
  async getPatientTreatmentStats(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: { id?: number; role?: { name?: string } },
  ): Promise<any> {
    if (user.role?.name === 'PATIENT' && Number(user.id) !== patientId) {
      throw new ForbiddenException('Patients can only access their own statistics')
    }
    const result = await this.patientTreatmentService.getPatientTreatmentStats(patientId)
    return result
  }

  @Get('stats/doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetDoctorWorkloadStats()
  async getDoctorWorkloadStats(@Param('doctorId', ParseIntPipe) doctorId: number): Promise<any> {
    const result = await this.patientTreatmentService.getDoctorWorkloadStats(doctorId)
    return result
  }

  @Get('analytics/custom-medication-stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetCustomMedicationStats()
  async getCustomMedicationStats(): Promise<any> {
    const result = await this.patientTreatmentService.getCustomMedicationStats()
    return result
  }

  @Get('analytics/protocol-comparison/:protocolId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiCompareProtocolVsCustomTreatments()
  async compareProtocolVsCustomTreatments(@Param('protocolId', ParseIntPipe) protocolId: number): Promise<any> {
    const result = await this.patientTreatmentService.compareProtocolVsCustomTreatments(protocolId)
    return result
  }

  @Get('analytics/compliance/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetTreatmentComplianceStats()
  async getTreatmentComplianceStats(
    @Param('patientId', ParseIntPipe) patientId: number,
  ): Promise<TreatmentComplianceStatsDto> {
    const result = await this.patientTreatmentService.getTreatmentComplianceStats(patientId)
    if (!result || typeof result !== 'object') throw new InternalServerErrorException('Unexpected result')
    // Explicit mapping for type safety
    return {
      patientId: Number(result.patientId),
      adherence: Number(result.adherence),
      missedDoses: Number(result.missedDoses),
      riskLevel: String(result.riskLevel),
      recommendations: Array.isArray(result.recommendations) ? result.recommendations.map(String) : [],
    }
  }

  @Get('analytics/cost-analysis')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentCostAnalysis()
  async getTreatmentCostAnalysis(@Query() query: PatientTreatmentQueryDto): Promise<TreatmentCostAnalysisDto> {
    const result = await this.patientTreatmentService.getTreatmentCostAnalysis(query)
    if (!result || typeof result !== 'object') throw new InternalServerErrorException('Unexpected result')
    // Explicit mapping for type safety
    return {
      totalCost: Number(result.totalCost),
      breakdown: typeof result.breakdown === 'object' && result.breakdown !== null ? result.breakdown : {},
      warnings: Array.isArray(result.warnings) ? result.warnings.map(String) : [],
    }
  }

  @Post('end-active/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiEndActivePatientTreatments()
  @ApiOperation({ summary: 'End all active treatments for a patient' })
  async endActivePatientTreatments(@Param('patientId', ParseIntPipe) patientId: number): Promise<any> {
    const result = await this.patientTreatmentService.endActivePatientTreatments(patientId)
    return result
  }

  @Get('validate/single-protocol/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Validate single protocol rule for a patient' })
  async validateSingleProtocolRule(@Param('patientId', ParseIntPipe) patientId: number): Promise<any> {
    const result = await this.patientTreatmentService.validateSingleProtocolRule(patientId)
    return result
  }

  @Post('calculate-cost')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentCostAnalysis()
  @ApiOperation({
    summary: 'Calculate treatment cost preview',
    description: 'Calculate estimated cost for a treatment before creating it. Useful for cost preview in frontend.',
  })
  async calculateTreatmentCost(
    @Body()
    costData: {
      protocolId: number
      customMedications?: { price?: number; durationUnit?: string; durationValue?: number }[]
      startDate: string
      endDate?: string
    },
  ): Promise<{
    isValid: boolean
    calculatedTotal: number
    breakdown: Record<string, any>
    warnings: string[]
  }> {
    const result = await this.patientTreatmentService.calculateTreatmentCost(
      costData.protocolId,
      costData.customMedications,
      new Date(costData.startDate),
      costData.endDate ? new Date(costData.endDate) : undefined,
    )
    if (!result || typeof result !== 'object') throw new InternalServerErrorException('Unexpected result')
    return {
      isValid: Boolean(result.isValid),
      calculatedTotal: Number(result.calculatedTotal ?? 0),
      breakdown: typeof result.breakdown === 'object' && result.breakdown !== null ? result.breakdown : {},
      warnings: Array.isArray(result.warnings) ? result.warnings.map(String) : [],
    }
  }

  @Get('analytics/general-stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Get general treatment statistics',
    description: 'Comprehensive overview statistics for all treatments including trends and top protocols.',
  })
  async getGeneralTreatmentStats(): Promise<any> {
    const result = await this.patientTreatmentService.getGeneralTreatmentStats()
    return result
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentById()
  async getPatientTreatmentById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id?: number; role?: { name?: string } },
  ): Promise<PatientTreatment> {
    const treatment = await this.patientTreatmentService.getPatientTreatmentById(id)
    if (!treatment || typeof treatment !== 'object') throw new InternalServerErrorException('Treatment not found')
    if (user.role?.name === 'PATIENT' && treatment.patientId !== Number(user.id)) {
      throw new ForbiddenException('Patients can only access their own treatment records')
    }
    return treatment
  }
}
