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
  ApiUpdateAppointment,
  ApiUpdateAppointmentStatus,
} from 'src/swagger/appoinment.swagger'
import { AppointmentStatus } from '@prisma/client'
import CustomZodValidationPipe from 'src/common/custom-zod-validate'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('Appoinments')
@Controller('appoinments')
export class AppoinmentController {
  constructor(private readonly appoinmentService: AppoinmentService) {}

  @ApiCreateAppointment()
  @Post()
  createAppointment(
    @Body(new CustomZodValidationPipe(CreateAppointmentDto)) body: CreateAppointmentDtoType,
  ): Promise<AppointmentResponseType> {
    return this.appoinmentService.createAppointment(body)
  }

  @ApiUpdateAppointment()
  @Put(':id')
  updateAppointment(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateAppointmentDto)) body: UpdateAppointmentDtoType,
  ): Promise<AppointmentResponseType> {
    return this.appoinmentService.updateAppointment(Number(id), body)
  }

  @ApiUpdateAppointmentStatus()
  @Put('status/:id/')
  updateAppointmentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ): Promise<AppointmentResponseType> {
    return this.appoinmentService.updateAppointmentStatus(id, status as AppointmentStatus)
  }

  @ApiDeleteAppointment()
  @Delete(':id')
  deleteAppointment(@Param('id', ParseIntPipe) id: number): Promise<AppointmentResponseType> {
    return this.appoinmentService.deleteAppointment(id)
  }

  @ApiFindAppointmentById()
  @Get(':id')
  findAppointmentById(@Param('id', ParseIntPipe) id: number): Promise<AppointmentResponseType> {
    return this.appoinmentService.findAppointmentById(id)
  }

  @ApiFindAppointmentByUserId()
  @Get('user/:id')
  findAppointmentByUserId(@Param('id', ParseIntPipe) id: number): Promise<AppointmentResponseType[]> {
    return this.appoinmentService.findAppointmentByUserId(id)
  }

  @ApiFindAppointmentByDoctorId()
  @Get('doctor/:id')
  findAppointmentByDoctorId(@Param('id', ParseIntPipe) id: number): Promise<AppointmentResponseType[]> {
    return this.appoinmentService.findAppointmentByDoctorId(id)
  }

  @ApiFindAppointmentsPaginated()
  @Get()
  findAppointmentsPaginated(@Query() query: unknown): Promise<PaginatedResponse<AppointmentResponseType>> {
    return this.appoinmentService.findAppointmentsPaginated(query)
  }
}
