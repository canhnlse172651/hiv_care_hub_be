import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PatientTreatment } from '@prisma/client'
import CustomZodValidationPipe from '../../../../common/custom-zod-validate'
import { AuthType } from '../../../../shared/constants/auth.constant'
import { Role } from '../../../../shared/constants/role.constant'
import { Auth } from '../../../../shared/decorators/auth.decorator'
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator'
import { Roles } from '../../../../shared/decorators/roles.decorator'
import { PaginatedResponse } from '../../../../shared/schemas/pagination.schema'
import {
  ApiCreatePatientTreatment,
  ApiDeletePatientTreatment,
  ApiGetActivePatientTreatments,
  ApiGetActivePatientTreatmentsByPatient,
  ApiGetAllPatientTreatments,
  ApiGetPatientTreatmentById,
  ApiGetPatientTreatmentsByDateRange,
  ApiGetPatientTreatmentsByDoctor,
  ApiGetPatientTreatmentsByPatient,
  ApiSearchPatientTreatments,
  ApiUpdatePatientTreatment,
} from '../../../../swagger/patient-treatment.swagger'
import {
  CreatePatientTreatmentDto,
  CreatePatientTreatmentDtoType,
  UpdatePatientTreatmentDto,
} from '../../patient-treatment.dto'
import { PatientTreatmentCoreService } from './patient-treatment-core.service'

@ApiBearerAuth()
@ApiTags('Patient Treatment - Core Operations')
@Controller('patient-treatments')
@Auth([AuthType.Bearer])
export class PatientTreatmentCoreController {
  private readonly logger = new Logger(PatientTreatmentCoreController.name)

  constructor(private readonly patientTreatmentCoreService: PatientTreatmentCoreService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreatePatientTreatment()
  async createPatientTreatment(
    @Body(new CustomZodValidationPipe(CreatePatientTreatmentDto))
    data: CreatePatientTreatmentDtoType,
    @CurrentUser() user: any,
    @Query('autoEndExisting') autoEndExisting?: string,
  ): Promise<PatientTreatment> {
    try {
      // Validate user
      if (!user || (!user.userId && !user.id)) {
        throw new BadRequestException('User information is required')
      }

      const userId = user.userId || user.id

      // Validate userId is a valid number
      const userIdNumber = Number(userId)
      if (isNaN(userIdNumber) || userIdNumber <= 0) {
        throw new BadRequestException('Invalid user ID')
      }

      // Parse autoEndExisting parameter
      const shouldAutoEnd = autoEndExisting === 'true'

      // Validate treatment data
      if (!data) {
        throw new BadRequestException('Treatment data is required')
      }

      this.logger.log(`Creating patient treatment for user ${userIdNumber}, autoEndExisting: ${shouldAutoEnd}`)

      const result = await this.patientTreatmentCoreService.createPatientTreatment(data, userIdNumber, shouldAutoEnd)

      this.logger.log(`Successfully created patient treatment with ID ${result.id}`)
      return result
    } catch (error) {
      this.logger.error(`Error creating patient treatment: ${error.message}`, error.stack)
      if (error instanceof HttpException) {
        throw error
      }
      throw new InternalServerErrorException('An unexpected error occurred while creating patient treatment')
    }
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
    return await this.patientTreatmentCoreService.getAllPatientTreatments(query)
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

    return await this.patientTreatmentCoreService.getPatientTreatmentsByPatientId(query)
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

    return await this.patientTreatmentCoreService.getPatientTreatmentsByDoctorId(query)
  }

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

    return await this.patientTreatmentCoreService.searchPatientTreatments(searchQuery, pageNum, limitNum)
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
    return await this.patientTreatmentCoreService.getPatientTreatmentsByDateRange(startDate, endDate)
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
    return await this.patientTreatmentCoreService.getActivePatientTreatments(query)
  }

  @Get('active/patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetActivePatientTreatmentsByPatient()
  async getActivePatientTreatmentsByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
  ): Promise<(PatientTreatment & { isCurrent: boolean })[]> {
    // If user is a patient, they can only see their own treatments
    const userId = user.userId || user.id
    if (user.role?.name === 'PATIENT' && Number(userId) !== patientId) {
      throw new ForbiddenException('Patients can only access their own treatment records')
    }

    return await this.patientTreatmentCoreService.getActivePatientTreatmentsByPatient(patientId)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentById()
  async getPatientTreatmentById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<PatientTreatment> {
    const treatment = await this.patientTreatmentCoreService.getPatientTreatmentById(id)

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
    return await this.patientTreatmentCoreService.updatePatientTreatment(id, validatedData)
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiDeletePatientTreatment()
  async deletePatientTreatment(@Param('id', ParseIntPipe) id: number): Promise<PatientTreatment> {
    return await this.patientTreatmentCoreService.deletePatientTreatment(id)
  }
}
