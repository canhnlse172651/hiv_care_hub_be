import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PatientTreatment } from '@prisma/client'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { Auth } from '../../shared/decorators/auth.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import {
  ApiCreatePatientTreatment,
  ApiDeletePatientTreatment,
  ApiGetAllPatientTreatments,
  ApiGetPatientTreatmentById,
  ApiGetPatientTreatmentsByDoctor,
  ApiGetPatientTreatmentsByPatient,
  ApiUpdatePatientTreatment,
  ApiSearchPatientTreatments,
  ApiGetPatientTreatmentsByDateRange,
  ApiGetActivePatientTreatments,
  ApiGetTreatmentsWithCustomMedications,
  ApiGetPatientTreatmentStats,
  ApiGetDoctorWorkloadStats,
  ApiGetCustomMedicationStats,
  ApiCompareProtocolVsCustomTreatments,
  ApiBulkCreatePatientTreatments,
} from '../../swagger/patient-treatment.swagger'
import {
  UpdatePatientTreatmentDto,
  BulkCreatePatientTreatmentDto,
  CreatePatientTreatmentDto,
  QueryPatientTreatmentDto,
  GetPatientTreatmentsByPatientDto,
  DateRangeQueryDto,
  PatientTreatmentStatsQueryDto,
  DoctorWorkloadQueryDto,
  CustomMedicationsQueryDto,
  ActiveTreatmentsQueryDto,
  SearchTreatmentsQueryDto,
  TreatmentCostAnalysisQueryDto,
  TreatmentComplianceQueryDto,
} from './patient-treatment.dto'
import { PatientTreatmentService } from './patient-treatment.service'

@ApiBearerAuth()
@ApiTags('Patient Treatment Management')
@Controller('patient-treatments')
@Auth([AuthType.Bearer])
export class PatientTreatmentController {
  constructor(private readonly patientTreatmentService: PatientTreatmentService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreatePatientTreatment()
  async createPatientTreatment(@Body() body: unknown, @CurrentUser() user: any): Promise<PatientTreatment> {
    return this.patientTreatmentService.createPatientTreatment(body, Number(user.userId))
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetAllPatientTreatments()
  async getAllPatientTreatments(
    @Query() query: QueryPatientTreatmentDto,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    return this.patientTreatmentService.getAllPatientTreatments(query)
  }

  @Get('patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentsByPatient()
  async getPatientTreatmentsByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: GetPatientTreatmentsByPatientDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    // If user is a patient, they can only see their own treatments
    if (user.role?.name === 'PATIENT' && user.id !== patientId) {
      const queryWithPatientId = {
        ...query,
        patientId: user.id.toString(),
      }
      return this.patientTreatmentService.getPatientTreatmentsByPatientId(queryWithPatientId)
    }

    const queryWithPatientId = {
      ...query,
      patientId: patientId.toString(),
    }

    return this.patientTreatmentService.getPatientTreatmentsByPatientId(queryWithPatientId)
  }

  @Get('doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetPatientTreatmentsByDoctor()
  async getPatientTreatmentsByDoctor(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query() query: QueryPatientTreatmentDto,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const queryWithDoctorId = {
      ...query,
      doctorId: doctorId.toString(),
    }
    return this.patientTreatmentService.getPatientTreatmentsByDoctorId(queryWithDoctorId)
  }

  // ===============================
  // SEARCH AND ADVANCED QUERIES
  // ===============================

  @Get('search')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiSearchPatientTreatments()
  async searchPatientTreatments(@Query('q') query: string): Promise<PatientTreatment[]> {
    return this.patientTreatmentService.searchPatientTreatments(query)
  }

  @Get('date-range')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetPatientTreatmentsByDateRange()
  async getPatientTreatmentsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<PatientTreatment[]> {
    return this.patientTreatmentService.getPatientTreatmentsByDateRange(new Date(startDate), new Date(endDate))
  }

  @Get('active')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetActivePatientTreatments()
  async getActivePatientTreatments(
    @Query() query: ActiveTreatmentsQueryDto,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    return this.patientTreatmentService.getActivePatientTreatments(query)
  }

  @Get('custom-medications')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentsWithCustomMedications()
  async getTreatmentsWithCustomMedications(
    @Query() query: CustomMedicationsQueryDto,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    return this.patientTreatmentService.findTreatmentsWithCustomMedications(query)
  }

  @Get('stats/patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentStats()
  async getPatientTreatmentStats(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
  ): Promise<any> {
    // If user is a patient, they can only see their own stats
    if (user.role?.name === 'PATIENT' && user.id !== patientId) {
      return this.patientTreatmentService.getPatientTreatmentStats(Number(user.id))
    }
    return this.patientTreatmentService.getPatientTreatmentStats(patientId)
  }

  @Get('stats/doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetDoctorWorkloadStats()
  async getDoctorWorkloadStats(@Param('doctorId', ParseIntPipe) doctorId: number): Promise<any> {
    return this.patientTreatmentService.getDoctorWorkloadStats(doctorId)
  }

  // New Analytics Endpoints

  @Get('analytics/custom-medication-stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  async getCustomMedicationStats() {
    return this.patientTreatmentService.getCustomMedicationStats()
  }

  @Get('analytics/protocol-comparison/:protocolId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  async compareProtocolVsCustomTreatments(@Param('protocolId', ParseIntPipe) protocolId: number) {
    return this.patientTreatmentService.compareProtocolVsCustomTreatments(protocolId)
  }

  @Get('analytics/compliance/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  async getTreatmentComplianceStats(@Param('patientId', ParseIntPipe) patientId: number, @CurrentUser() user: any) {
    // If user is a patient, they can only see their own compliance stats
    if (user.role?.name === 'PATIENT' && user.id !== patientId) {
      return this.patientTreatmentService.getTreatmentComplianceStats(Number(user.id))
    }
    return this.patientTreatmentService.getTreatmentComplianceStats(patientId)
  }

  @Get('analytics/cost-analysis')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  async getTreatmentCostAnalysis(@Query() query: TreatmentCostAnalysisQueryDto) {
    const params = {
      patientId: query.patientId,
      doctorId: query.doctorId,
      protocolId: query.protocolId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    }
    return this.patientTreatmentService.getTreatmentCostAnalysis(params)
  }

  // Move the :id route to the end to avoid conflicts
  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentById()
  async getPatientTreatmentById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<PatientTreatment> {
    const treatment = await this.patientTreatmentService.getPatientTreatmentById(id)

    // If user is a patient, they can only see their own treatments
    if (user.role?.name === 'PATIENT' && treatment.patientId !== user.id) {
      throw new Error('Forbidden')
    }

    return treatment
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdatePatientTreatment()
  async updatePatientTreatment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ): Promise<PatientTreatment> {
    const validatedData = UpdatePatientTreatmentDto.create(body)
    return this.patientTreatmentService.updatePatientTreatment(id, validatedData)
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiDeletePatientTreatment()
  async deletePatientTreatment(@Param('id', ParseIntPipe) id: number): Promise<PatientTreatment> {
    return this.patientTreatmentService.deletePatientTreatment(id)
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.Doctor)
  @ApiBulkCreatePatientTreatments()
  async bulkCreatePatientTreatments(
    @Body() data: BulkCreatePatientTreatmentDto,
    @CurrentUser() user: any,
  ): Promise<PatientTreatment[]> {
    return this.patientTreatmentService.bulkCreatePatientTreatments(data, Number(user.userId))
  }
}
