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
import CustomZodValidationPipe from '../../common/custom-zod-validate'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { Auth } from '../../shared/decorators/auth.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
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
} from '../../swagger/patient-treatment.swagger'
import { TreatmentComplianceStatsDto, TreatmentCostAnalysisDto } from './patient-treatment.analytics.dto'
import {
  CreatePatientTreatmentDto,
  CreatePatientTreatmentDtoType,
  PatientTreatmentQueryDto,
} from './patient-treatment.dto'
import { PatientTreatmentService } from './patient-treatment.service'

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
    @CurrentUser() user: any,
    @Query('autoEndExisting') autoEndExisting?: string,
  ): Promise<PatientTreatment> {
    const userId = user.userId || user.id
    return this.patientTreatmentService.createPatientTreatment(data, Number(userId), autoEndExisting === 'true')
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
    return this.patientTreatmentService.getAllPatientTreatments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      startDate,
      endDate,
    })
  }

  @Get('patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentsByPatient()
  async getPatientTreatmentsByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeCompleted') includeCompleted?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const userId = user.userId || user.id
    if (user.role?.name === 'PATIENT' && Number(userId) !== patientId) {
      throw new ForbiddenException('Patients can only access their own treatment records')
    }
    return this.patientTreatmentService.getPatientTreatmentsByPatientId({
      patientId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      includeCompleted: includeCompleted === 'true' || includeCompleted === undefined,
      startDate,
      endDate,
    })
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
    return this.patientTreatmentService.getPatientTreatmentsByDoctorId({
      doctorId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    })
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
    return this.patientTreatmentService.searchPatientTreatments(searchQuery, pageNum, limitNum)
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
    return this.patientTreatmentService.getPatientTreatmentsByDateRange(startDate, endDate)
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
    return this.patientTreatmentService.getActivePatientTreatments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      patientId: patientId ? Number(patientId) : undefined,
      doctorId: doctorId ? Number(doctorId) : undefined,
      protocolId: protocolId ? Number(protocolId) : undefined,
    })
  }

  @Get('active/patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetActivePatientTreatmentsByPatient()
  getActivePatientTreatmentsByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    const result = this.patientTreatmentService.getActivePatientTreatmentsByPatient(patientId)
    if (!result || typeof result !== 'object') throw new InternalServerErrorException('Unexpected result')
    return result
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
    return this.patientTreatmentService.findTreatmentsWithCustomMedications({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      hasCustomMeds: hasCustomMeds === 'true',
    })
  }

  // ===============================
  // Analytics & Stats
  // ===============================

  @Get('stats/patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentStats()
  async getPatientTreatmentStats(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
  ): Promise<any> {
    if (user.role?.name === 'PATIENT' && Number(user.id) !== patientId) {
      throw new ForbiddenException('Patients can only access their own statistics')
    }
    return this.patientTreatmentService.getPatientTreatmentStats(patientId)
  }

  @Get('stats/doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetDoctorWorkloadStats()
  async getDoctorWorkloadStats(@Param('doctorId', ParseIntPipe) doctorId: number): Promise<any> {
    return this.patientTreatmentService.getDoctorWorkloadStats(doctorId)
  }

  @Get('analytics/custom-medication-stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetCustomMedicationStats()
  getCustomMedicationStats() {
    return this.patientTreatmentService.getCustomMedicationStats()
  }

  @Get('analytics/protocol-comparison/:protocolId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiCompareProtocolVsCustomTreatments()
  compareProtocolVsCustomTreatments(@Param('protocolId', ParseIntPipe) protocolId: number) {
    return this.patientTreatmentService.compareProtocolVsCustomTreatments(protocolId)
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
  endActivePatientTreatments(@Param('patientId', ParseIntPipe) patientId: number) {
    const result = this.patientTreatmentService.endActivePatientTreatments(patientId)
    if (!result || typeof result !== 'object') throw new InternalServerErrorException('Unexpected result')
    return {
      success: Boolean(result.success),
      message: result.message ?? '',
      deactivatedCount: result.deactivatedCount ?? 0,
      endDate: result.endDate ?? new Date(),
      activeTreatments: Array.isArray(result.activeTreatments) ? result.activeTreatments : [],
    }
  }

  @Get('validate/single-protocol/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Validate single protocol rule for a patient' })
  validateSingleProtocolRule(@Param('patientId', ParseIntPipe) patientId: number) {
    const result = this.patientTreatmentService.validateSingleProtocolRule(patientId)
    if (!result || typeof result !== 'object') throw new InternalServerErrorException('Unexpected result')
    return {
      isValid: Boolean(result.isValid),
      errors: Array.isArray(result.errors) ? result.errors : [],
      currentTreatments: Array.isArray(result.currentTreatments) ? result.currentTreatments : [],
    }
  }

  @Post('calculate-cost')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Calculate treatment cost preview',
    description: 'Calculate estimated cost for a treatment before creating it. Useful for cost preview in frontend.',
  })
  calculateTreatmentCost(
    @Body()
    costData: {
      protocolId: number
      customMedications?: { cost: number }[]
      startDate: string
      endDate?: string
    },
  ) {
    const result = this.patientTreatmentService.calculateTreatmentCost(
      costData.protocolId,
      costData.customMedications,
      new Date(costData.startDate),
      costData.endDate ? new Date(costData.endDate) : undefined,
    )
    if (!result || typeof result !== 'object') throw new InternalServerErrorException('Unexpected result')
    return {
      isValid: Boolean(result.isValid),
      calculatedTotal: result.calculatedTotal ?? 0,
      breakdown: result.breakdown ?? {},
      warnings: Array.isArray(result.warnings) ? result.warnings : [],
    }
  }

  @Get('analytics/general-stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Get general treatment statistics',
    description: 'Comprehensive overview statistics for all treatments including trends and top protocols.',
  })
  async getGeneralTreatmentStats() {
    return this.patientTreatmentService.getGeneralTreatmentStats()
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentById()
  async getPatientTreatmentById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<PatientTreatment> {
    const treatment = await this.patientTreatmentService.getPatientTreatmentById(id)
    if (!treatment || typeof treatment !== 'object') throw new InternalServerErrorException('Treatment not found')
    if (user.role?.name === 'PATIENT' && treatment.patientId !== Number(user.id)) {
      throw new ForbiddenException('Patients can only access their own treatment records')
    }
    return treatment
  }
}
