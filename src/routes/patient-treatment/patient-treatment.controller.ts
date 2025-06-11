import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import CustomZodValidationPipe from '../../common/custom-zod-validate'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { ActiveUser } from '../../shared/decorators/active-user.decorator'
import { Auth } from '../../shared/decorators/auth.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import {
  ApiCreatePatientTreatment,
  ApiGetAllPatientTreatments,
  ApiGetPatientTreatmentById,
  ApiGetTreatmentsByPatient,
  ApiGetAdherenceReports,
  ApiUpdatePatientTreatment,
  ApiUpdateTreatmentStatus,
  ApiRecordAdherence,
  ApiCustomizeMedications,
  ApiBulkUpdateStatus,
  ApiDeletePatientTreatment,
  ApiRestorePatientTreatment,
} from '../../swagger/patient-treatment.swagger'
import {
  AddAdditionalMedicationDto,
  AddAdditionalMedicationDtoType,
  BulkUpdateStatusDto,
  BulkUpdateStatusDtoType,
  CreatePatientTreatmentDto,
  CreatePatientTreatmentDtoType,
  CustomizeMedicationsDto,
  CustomizeMedicationsDtoType,
  QueryPatientTreatmentDto,
  QueryPatientTreatmentDtoType,
  RecordAdherenceDto,
  RecordAdherenceDtoType,
  RemoveMedicationDto,
  RemoveMedicationDtoType,
  UpdateMedicationDto,
  UpdateMedicationDtoType,
  UpdatePatientTreatmentDto,
  UpdatePatientTreatmentDtoType,
  UpdateTreatmentStatusDto,
  UpdateTreatmentStatusDtoType,
} from './patient-treatment.dto'
import { PatientTreatmentService } from './patient-treatment.service'

@ApiTags('Patient Treatments')
@ApiBearerAuth()
@Controller('patient-treatments')
@Auth([AuthType.Bearer])
export class PatientTreatmentController {
  constructor(private readonly patientTreatmentService: PatientTreatmentService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreatePatientTreatment()
  async createTreatment(
    @Body(new CustomZodValidationPipe(CreatePatientTreatmentDto)) data: CreatePatientTreatmentDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.createTreatment(data, userId)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetAllPatientTreatments()
  async getAllTreatments(
    @Query(new CustomZodValidationPipe(QueryPatientTreatmentDto)) query: QueryPatientTreatmentDtoType,
  ) {
    return await this.patientTreatmentService.getAllTreatments(query)
  }

  @Get('patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetTreatmentsByPatient()
  async getTreatmentsByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return await this.patientTreatmentService.getTreatmentsByPatient(patientId)
  }

  @Get('patient/:patientId/active')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetTreatmentsByPatient()
  async getActiveTreatmentsByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return await this.patientTreatmentService.getActiveTreatmentsByPatient(patientId)
  }

  @Get('protocol/:protocolId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentsByPatient()
  async getTreatmentsByProtocol(@Param('protocolId', ParseIntPipe) protocolId: number) {
    return await this.patientTreatmentService.getTreatmentsByProtocol(protocolId)
  }

  @Get('adherence-reports')
  @Roles(Role.Admin, Role.Doctor)
  @ApiGetAdherenceReports()
  async getAdherenceReports(@Query('patientId') patientId?: string, @Query('protocolId') protocolId?: string) {
    const patientIdNum = patientId ? parseInt(patientId) : undefined
    const protocolIdNum = protocolId ? parseInt(protocolId) : undefined
    return await this.patientTreatmentService.getAdherenceReports(patientIdNum, protocolIdNum)
  }

  @Get('statistics')
  @Roles(Role.Admin, Role.Doctor)
  @ApiGetAdherenceReports()
  async getTreatmentStatistics(@Query('patientId') patientId?: string, @Query('protocolId') protocolId?: string) {
    const patientIdNum = patientId ? parseInt(patientId) : undefined
    const protocolIdNum = protocolId ? parseInt(protocolId) : undefined
    return await this.patientTreatmentService.getTreatmentStatistics(patientIdNum, protocolIdNum)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentById()
  async getTreatmentById(@Param('id', ParseIntPipe) id: number) {
    return await this.patientTreatmentService.getTreatmentById(id)
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdatePatientTreatment()
  async updateTreatment(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdatePatientTreatmentDto)) data: UpdatePatientTreatmentDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.updateTreatment(id, data, userId)
  }

  @Patch(':id/status')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdateTreatmentStatus()
  async updateTreatmentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateTreatmentStatusDto)) data: UpdateTreatmentStatusDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.updateTreatmentStatus(id, data, userId)
  }

  @Patch(':id/adherence')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiRecordAdherence()
  async recordAdherence(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(RecordAdherenceDto)) data: RecordAdherenceDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.recordAdherence(id, data, userId)
  }

  @Patch('bulk-update-status')
  @Roles(Role.Admin, Role.Doctor)
  @ApiBulkUpdateStatus()
  async bulkUpdateStatus(
    @Body(new CustomZodValidationPipe(BulkUpdateStatusDto)) data: BulkUpdateStatusDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.bulkUpdateStatus(data, userId)
  }

  @Patch(':id/restore')
  @Roles(Role.Admin)
  @ApiRestorePatientTreatment()
  async restoreTreatment(@Param('id', ParseIntPipe) id: number) {
    return await this.patientTreatmentService.restoreTreatment(id)
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiDeletePatientTreatment()
  async deleteTreatment(@Param('id', ParseIntPipe) id: number) {
    return await this.patientTreatmentService.deleteTreatment(id)
  }

  @Patch(':id/medications')
  @Roles(Role.Admin, Role.Doctor)
  @ApiCustomizeMedications()
  async customizeMedications(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(CustomizeMedicationsDto)) data: CustomizeMedicationsDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.customizeMedications(id, data.customMedications, userId)
  }

  @Get(':id/medications')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiCustomizeMedications()
  async getCustomizedMedications(@Param('id', ParseIntPipe) id: number) {
    return await this.patientTreatmentService.getCustomizedMedications(id)
  }

  @Post(':id/medications/add')
  @Roles(Role.Admin, Role.Doctor)
  @ApiCustomizeMedications()
  async addAdditionalMedication(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(AddAdditionalMedicationDto)) data: AddAdditionalMedicationDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.addAdditionalMedication(id, data, userId)
  }

  @Patch(':id/medications/:medicineId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiCustomizeMedications()
  async updateMedicationInTreatment(
    @Param('id', ParseIntPipe) id: number,
    @Param('medicineId', ParseIntPipe) medicineId: number,
    @Body(new CustomZodValidationPipe(UpdateMedicationDto)) data: UpdateMedicationDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.updateMedicationInTreatment(id, medicineId, data, userId)
  }

  @Delete(':id/medications/:medicineId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiCustomizeMedications()
  async removeMedicationFromTreatment(
    @Param('id', ParseIntPipe) id: number,
    @Param('medicineId', ParseIntPipe) medicineId: number,
    @Body(new CustomZodValidationPipe(RemoveMedicationDto)) data: RemoveMedicationDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.patientTreatmentService.removeMedicationFromTreatment(id, medicineId, data.reason, userId)
  }
}
