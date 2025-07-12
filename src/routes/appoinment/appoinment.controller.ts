import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
import { AppoinmentService } from './appoinment.service'
import {
  AppointmentResponseType,
  CreateAppointmentDto,
  CreateAppointmentDtoType,
  UpdateAppointmentDto,
  UpdateAppointmentDtoType,
} from './appoinment.dto'
import { PaginatedResponse, PaginationOptions } from 'src/shared/schemas/pagination.schema'
import {
  ApiCreateAppointment,
  ApiDeleteAppointment,
  ApiFindAppointmentByDoctorId,
  ApiFindAppointmentById,
  ApiFindAppointmentByUserId,
  ApiFindAppointmentsPaginated,
  ApiFindAppointmentsPaginatedByStaff,
  ApiUpdateAppointment,
  ApiUpdateAppointmentStatus,
} from 'src/swagger/appoinment.swagger'
import { AppointmentStatus } from '@prisma/client'
import CustomZodValidationPipe from 'src/common/custom-zod-validate'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { Role } from 'src/shared/constants/role.constant'

@ApiTags('Appointments')
@ApiBearerAuth()
@Auth([AuthType.Bearer])
@Controller('appointments')
export class AppoinmentController {
  constructor(private readonly appoinmentService: AppoinmentService) {}

  @ApiBearerAuth()
  @Auth([AuthType.Bearer])
  @ApiCreateAppointment()
  @Roles(Role.Patient, Role.Staff, Role.Doctor)
  @Post()
  createAppointment(
    @Body(new CustomZodValidationPipe(CreateAppointmentDto)) body: CreateAppointmentDtoType,
  ): Promise<AppointmentResponseType> {
    return this.appoinmentService.createAppointment(body)
  }

  @ApiUpdateAppointment()
  @Roles(Role.Staff, Role.Doctor)
  @Put(':id')
  updateAppointment(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateAppointmentDto)) body: UpdateAppointmentDtoType,
  ): Promise<AppointmentResponseType> {
    return this.appoinmentService.updateAppointment(Number(id), body)
  }

  @ApiUpdateAppointmentStatus()
  @Roles(Role.Staff, Role.Doctor, Role.Patient)
  @Put('status/:id/')
  updateAppointmentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ): Promise<AppointmentResponseType> {
    return this.appoinmentService.updateAppointmentStatus(id, status as AppointmentStatus)
  }

  @ApiDeleteAppointment()
  @Roles(Role.Admin, Role.Staff)
  @Delete(':id')
  deleteAppointment(@Param('id', ParseIntPipe) id: number): Promise<AppointmentResponseType> {
    return this.appoinmentService.deleteAppointment(id)
  }

  @ApiFindAppointmentByUserId()
  @Roles(Role.Patient, Role.Admin)
  @Get('user/:id')
  findAppointmentByUserId(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: unknown,
  ): Promise<PaginatedResponse<AppointmentResponseType>> {
    return this.appoinmentService.findAppointmentByUserId(id, query)
  }

  @ApiFindAppointmentByDoctorId()
  @Roles(Role.Doctor, Role.Admin)
  @Get('doctor/:id')
  findAppointmentByDoctorId(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: unknown,
  ): Promise<PaginatedResponse<AppointmentResponseType>> {
    return this.appoinmentService.findAppointmentByDoctorId(id, query)
  }

  @ApiFindAppointmentsPaginated()
  @Roles(Role.Admin)
  @Get()
  findAppointmentsPaginated(@Query() query: unknown): Promise<PaginatedResponse<AppointmentResponseType>> {
    return this.appoinmentService.findAppointmentsPaginated(query)
  }

  @ApiFindAppointmentsPaginatedByStaff()
  @Roles(Role.Staff)
  @Get('staff')
  findAppointmentsPaginatedByStaff(@Query() query: unknown): Promise<PaginatedResponse<AppointmentResponseType>> {
    return this.appoinmentService.findAppointmentsPaginatedByStaff(query)
  }

  @ApiFindAppointmentById()
  @Get(':id')
  findAppointmentById(@Param('id', ParseIntPipe) id: number): Promise<AppointmentResponseType> {
    return this.appoinmentService.findAppointmentById(id)
  }
}
