import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ParseIntPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { DoctorService } from './doctor.service'
import { Doctor } from '@prisma/client'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from '../../shared/constants/role.constant'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  QueryDoctorDto,
 
  GetDoctorScheduleDto,
  GenerateScheduleDto,
} from './doctor.dto'
import {
  ApiGetAllDoctors,
  ApiGetDoctorById,
  ApiCreateDoctor,
  ApiUpdateDoctor,
  ApiDeleteDoctor,
  ApiGetDoctorSchedule,
  ApiGenerateSchedule,
} from '../../swagger/doctor.swagger'

@ApiBearerAuth()
@ApiTags('Doctor Management')
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  // @Roles(Role.Admin)
  @ApiCreateDoctor()
  async createDoctor(@Body() body: unknown): Promise<Doctor> {
    const validatedData = CreateDoctorDto.create(body)
    return this.doctorService.createDoctor(validatedData)
  }

  @Get()
  // @Roles(Role.Admin)
  @ApiGetAllDoctors()
  async findAllDoctors(@Query() query: unknown): Promise<PaginatedResponse<Doctor>> {
    const validatedQuery = QueryDoctorDto.create(query)
    return this.doctorService.findAllDoctors(validatedQuery)
  }

  @Get(':id')
  // @Roles(Role.Admin)
  @ApiGetDoctorById()
  async findDoctorById(@Param('id', ParseIntPipe) id: number): Promise<Doctor | null> {
    return this.doctorService.findDoctorById(id)
  }

  @Put(':id')
  // @Roles(Role.Admin)
  @ApiUpdateDoctor()
  async updateDoctor(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<Doctor> {
    const validatedData = UpdateDoctorDto.create(body)
    return this.doctorService.updateDoctor(id, validatedData)
  }

  @Delete(':id')
  // @Roles(Role.Admin)
  @ApiDeleteDoctor()
  async deleteDoctor(@Param('id', ParseIntPipe) id: number): Promise<Doctor> {
    return this.doctorService.deleteDoctor(id)
  }

  @Get(':id/schedule')
  @ApiGetDoctorSchedule()
  async getDoctorSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: unknown,
  ) {
    const dto = GetDoctorScheduleDto.create(query)
    return this.doctorService.getDoctorSchedule(id, dto)
  }

  @Post('schedule/generate')
  // @Roles(Role.Admin)
  @ApiGenerateSchedule()
  async generateSchedule(@Body() body: unknown) {
    const dto = GenerateScheduleDto.create(body)
    return this.doctorService.generateSchedule(dto.doctorsPerShift, new Date(dto.startDate))
  }
}
