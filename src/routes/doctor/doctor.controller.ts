import { Body, Controller, Delete, Get, Param, Post, Put, Query, ParseIntPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { DoctorService } from './doctor.service'
import { Doctor } from '@prisma/client'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  QueryDoctorDto,
  GetDoctorScheduleDto,
  GenerateScheduleDto,
  GetDoctorByDateDto,
  ManualScheduleAssignmentDto,
} from './doctor.dto'
import {
  ApiGetAllDoctors,
  ApiGetDoctorById,
  ApiCreateDoctor,
  ApiUpdateDoctor,
  ApiDeleteDoctor,
  ApiGetDoctorSchedule,
  ApiGenerateSchedule,
  ApiAssignDoctorsManually,
  ApiSwapShifts,
  ApiGetDoctorsByDate,
} from '../../swagger/doctor.swagger'
import { ManualScheduleAssignmentType, SwapShiftsType } from './doctor.model'

@ApiBearerAuth()
@ApiTags('Doctors')
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

  @Get('schedule/weekly')
  @ApiGetAllDoctors()
  async getWeeklySchedule(@Query() query: unknown): Promise<any> {
    const validatedQuery = QueryDoctorDto.create(query)
    
    // Set default date range to current week if not provided
    let startDate = validatedQuery.startDate
    let endDate = validatedQuery.endDate
    
    if (!startDate || !endDate) {
      const now = new Date()
      const currentDay = now.getDay()
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1 // Sunday = 0, Monday = 1
      
      startDate = new Date(now)
      startDate.setDate(now.getDate() - daysFromMonday)
      startDate.setHours(0, 0, 0, 0)
      
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6) // End of week (Sunday)
      endDate.setHours(23, 59, 59, 999)
    }
    
    return this.doctorService.getWeeklySchedule(startDate, endDate)
  }

  @Get(':id/schedule')
  @ApiGetDoctorSchedule()
  async getDoctorSchedule(@Param('id', ParseIntPipe) id: number, @Query() query: unknown) {
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

  @Post('schedule/manual')
  @ApiAssignDoctorsManually()
  async assignDoctorsManually(@Body() body: unknown) {
    const dto = ManualScheduleAssignmentDto.create(body)
    return this.doctorService.assignDoctorsManually(dto)
  }

  @Post('schedule/swap')
  // @Roles(Role.Admin)
  @ApiSwapShifts()
  async swapShifts(@Body() data: SwapShiftsType) {
    return this.doctorService.swapShifts(data)
  }

  @ApiGetDoctorsByDate()
  @Get('schedule/by-date')
  async getDoctorsByDate(@Query('date') date: string): Promise<Doctor[]> {
    const parsedDate = new Date(date)
    console.log('date', date)
    console.log('parsedDate', parsedDate)
    return this.doctorService.getDoctorsByDate(parsedDate)
  }
}
