import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, Patch } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PatientTreatmentService } from './patient-treatment.service'
import {
  CreatePatientTreatmentDto,
  UpdatePatientTreatmentDto,
  QueryPatientTreatmentDto,
  UpdateTreatmentStatusDto,
  RecordAdherenceDto,
  BulkUpdateStatusDto,
  CreatePatientTreatmentDtoType,
  UpdatePatientTreatmentDtoType,
  QueryPatientTreatmentDtoType,
  UpdateTreatmentStatusDtoType,
  RecordAdherenceDtoType,
  BulkUpdateStatusDtoType,
} from './patient-treatment.dto'
import CustomZodValidationPipe from '../../common/custom-zod-validate'
import { Auth } from '../../shared/decorators/auth.decorator'
import { AuthType } from '../../shared/constants/auth.constant'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from '../../shared/constants/role.constant'
import { ActiveUser } from '../../shared/decorators/active-user.decorator'

@ApiTags('Patient Treatments')
@ApiBearerAuth()
@Controller('patient-treatments')
@Auth([AuthType.Bearer])
export class PatientTreatmentController {
  constructor(private readonly patientTreatmentService: PatientTreatmentService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Create a new patient treatment' })
  @ApiResponse({ status: 201, description: 'Patient treatment created successfully' })
  async createTreatment(
    @Body(new CustomZodValidationPipe(CreatePatientTreatmentDto)) data: CreatePatientTreatmentDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.createTreatment(data, userId)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Get all patient treatments with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Patient treatments retrieved successfully' })
  async getAllTreatments(
    @Query(new CustomZodValidationPipe(QueryPatientTreatmentDto)) query: QueryPatientTreatmentDtoType,
  ) {
    return await this.patientTreatmentService.getAllTreatments(query)
  }

  @Get('patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiOperation({ summary: 'Get treatments by patient ID' })
  @ApiResponse({ status: 200, description: 'Patient treatments retrieved successfully' })
  async getTreatmentsByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return await this.patientTreatmentService.getTreatmentsByPatient(patientId)
  }

  @Get('patient/:patientId/active')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiOperation({ summary: 'Get active treatments by patient ID' })
  @ApiResponse({ status: 200, description: 'Active patient treatments retrieved successfully' })
  async getActiveTreatmentsByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return await this.patientTreatmentService.getActiveTreatmentsByPatient(patientId)
  }

  @Get('protocol/:protocolId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Get treatments by protocol ID' })
  @ApiResponse({ status: 200, description: 'Protocol treatments retrieved successfully' })
  async getTreatmentsByProtocol(@Param('protocolId', ParseIntPipe) protocolId: number) {
    return await this.patientTreatmentService.getTreatmentsByProtocol(protocolId)
  }

  @Get('adherence-reports')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Get adherence reports' })
  @ApiResponse({ status: 200, description: 'Adherence reports retrieved successfully' })
  async getAdherenceReports(@Query('patientId') patientId?: string, @Query('protocolId') protocolId?: string) {
    const patientIdNum = patientId ? parseInt(patientId) : undefined
    const protocolIdNum = protocolId ? parseInt(protocolId) : undefined
    return await this.patientTreatmentService.getAdherenceReports(patientIdNum, protocolIdNum)
  }

  @Get('statistics')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Get treatment statistics' })
  @ApiResponse({ status: 200, description: 'Treatment statistics retrieved successfully' })
  async getTreatmentStatistics(@Query('patientId') patientId?: string, @Query('protocolId') protocolId?: string) {
    const patientIdNum = patientId ? parseInt(patientId) : undefined
    const protocolIdNum = protocolId ? parseInt(protocolId) : undefined
    return await this.patientTreatmentService.getTreatmentStatistics(patientIdNum, protocolIdNum)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiOperation({ summary: 'Get patient treatment by ID' })
  @ApiResponse({ status: 200, description: 'Patient treatment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient treatment not found' })
  async getTreatmentById(@Param('id', ParseIntPipe) id: number) {
    return await this.patientTreatmentService.getTreatmentById(id)
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Update patient treatment' })
  @ApiResponse({ status: 200, description: 'Patient treatment updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient treatment not found' })
  async updateTreatment(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdatePatientTreatmentDto)) data: UpdatePatientTreatmentDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.updateTreatment(id, data, userId)
  }

  @Patch(':id/status')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Update treatment status' })
  @ApiResponse({ status: 200, description: 'Treatment status updated successfully' })
  async updateTreatmentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateTreatmentStatusDto)) data: UpdateTreatmentStatusDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.updateTreatmentStatus(id, data, userId)
  }

  @Patch(':id/adherence')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Record patient adherence' })
  @ApiResponse({ status: 200, description: 'Adherence recorded successfully' })
  async recordAdherence(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(RecordAdherenceDto)) data: RecordAdherenceDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.recordAdherence(id, data, userId)
  }

  @Patch('bulk-update-status')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Bulk update treatment status' })
  @ApiResponse({ status: 200, description: 'Treatment statuses updated successfully' })
  async bulkUpdateStatus(
    @Body(new CustomZodValidationPipe(BulkUpdateStatusDto)) data: BulkUpdateStatusDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.bulkUpdateStatus(data, userId)
  }

  @Patch(':id/restore')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Restore deleted patient treatment' })
  @ApiResponse({ status: 200, description: 'Patient treatment restored successfully' })
  async restoreTreatment(@Param('id', ParseIntPipe) id: number) {
    return await this.patientTreatmentService.restoreTreatment(id)
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Delete patient treatment' })
  @ApiResponse({ status: 200, description: 'Patient treatment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Patient treatment not found' })
  async deleteTreatment(@Param('id', ParseIntPipe) id: number) {
    return await this.patientTreatmentService.deleteTreatment(id)
  }
}
