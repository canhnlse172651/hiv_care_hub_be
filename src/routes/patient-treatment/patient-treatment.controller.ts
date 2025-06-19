import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PatientTreatment } from '@prisma/client'
import CustomZodValidationPipe from '../../common/custom-zod-validate'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { Auth } from '../../shared/decorators/auth.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import {
  ApiBulkCreatePatientTreatments,
  ApiCreatePatientTreatment,
  ApiDeletePatientTreatment,
  ApiGetActivePatientTreatments,
  ApiGetAllPatientTreatments,
  ApiGetDoctorWorkloadStats,
  ApiGetPatientTreatmentById,
  ApiGetPatientTreatmentsByDateRange,
  ApiGetPatientTreatmentsByDoctor,
  ApiGetPatientTreatmentsByPatient,
  ApiGetPatientTreatmentStats,
  ApiGetTreatmentsWithCustomMedications,
  ApiSearchPatientTreatments,
  ApiUpdatePatientTreatment,
} from '../../swagger/patient-treatment.swagger'
import {
  BulkCreatePatientTreatmentDto,
  CreatePatientTreatmentDto,
  CreatePatientTreatmentDtoType,
  PatientTreatmentQueryDto,
  UpdatePatientTreatmentDto,
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
  async createPatientTreatment(
    @Body(new CustomZodValidationPipe(CreatePatientTreatmentDto))
    data: CreatePatientTreatmentDtoType,
    @CurrentUser() user: any,
  ): Promise<PatientTreatment> {
    // Use userId from JWT payload
    const userId = user.userId || user.id
    return this.patientTreatmentService.createPatientTreatment(data, Number(userId))
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
    const query = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      startDate,
      endDate,
    }
    return this.patientTreatmentService.getAllPatientTreatments(query)
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
    // If user is a patient, they can only see their own treatments
    const userId = user.userId || user.id
    if (user.role?.name === 'PATIENT' && Number(userId) !== patientId) {
      throw new ForbiddenException('Patients can only access their own treatment records')
    }

    const query = {
      patientId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      includeCompleted: includeCompleted === 'true' || includeCompleted === undefined,
      startDate,
      endDate,
    }

    return this.patientTreatmentService.getPatientTreatmentsByPatientId(query)
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
    const query = {
      doctorId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    }

    return this.patientTreatmentService.getPatientTreatmentsByDoctorId(query)
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
  ): Promise<PatientTreatment[]> {
    const searchQuery = search || q || query || ''
    return this.patientTreatmentService.searchPatientTreatments(searchQuery)
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
    const query = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      patientId: patientId ? Number(patientId) : undefined,
      doctorId: doctorId ? Number(doctorId) : undefined,
      protocolId: protocolId ? Number(protocolId) : undefined,
    }
    return this.patientTreatmentService.getActivePatientTreatments(query)
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
    const query = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      hasCustomMeds: hasCustomMeds === 'true',
    }
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
    if (user.role?.name === 'PATIENT' && Number(user.id) !== patientId) {
      throw new ForbiddenException('Patients can only access their own compliance statistics')
    }
    return this.patientTreatmentService.getTreatmentComplianceStats(patientId)
  }

  @Get('analytics/cost-analysis')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  async getTreatmentCostAnalysis(@Query() query: PatientTreatmentQueryDto) {
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
    if (user.role?.name === 'PATIENT' && treatment.patientId !== Number(user.id)) {
      throw new ForbiddenException('Patients can only access their own treatment records')
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
    // Use consistent user ID property
    return this.patientTreatmentService.bulkCreatePatientTreatments(data, Number(user.id))
  }
}
