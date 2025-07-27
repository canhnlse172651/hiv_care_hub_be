import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import { MeetingRecordService } from './meeting-record.service'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { Role } from 'src/shared/constants/role.constant'
import {
  CreateMeetingRecordDto,
  CreateMeetingRecordDtoType,
  MeetingRecordResponseType,
  UpdateMeetingRecordDto,
  UpdateMeetingRecordDtoType,
} from './meeting-record.dto'
import CustomZodValidationPipe from 'src/common/custom-zod-validate'
import { PaginatedResponse } from 'src/shared/schemas/pagination.schema'
import { ApiCreateMeetingRecord, ApiDeleteMeetingRecord, ApiGetAllMeetingRecords, ApiGetMeetingRecordByAppointmentId, ApiGetMeetingRecordById, ApiGetMeetingRecordByPatientId, ApiUpdateMeetingRecord } from 'src/swagger/meeting-record.swagger'

@ApiTags('Meeting Record')
@ApiBearerAuth()
@Auth([AuthType.Bearer])
@Controller('meeting-record')
export class MeetingRecordController {
  constructor(private readonly meetingRecordService: MeetingRecordService) {}
  
  @Roles(Role.Doctor, Role.Staff)
  @ApiCreateMeetingRecord()
  @Post()
  async createMeetingRecord(
    @Body(new CustomZodValidationPipe(CreateMeetingRecordDto)) data: CreateMeetingRecordDtoType,
  ): Promise<MeetingRecordResponseType> {
    return this.meetingRecordService.createMeetingRecord(data)
  }

  @Roles(Role.Doctor, Role.Staff, Role.Admin)
  @ApiGetAllMeetingRecords()
  @Get()
  async getAllMeetingRecord(@Query() query: unknown): Promise<PaginatedResponse<MeetingRecordResponseType>> {
    return this.meetingRecordService.getAllMeetingRecord(query)
  }

  @ApiGetMeetingRecordById()
  @Get(':id')
  async getMeetingRecordById(@Param('id', ParseIntPipe) id: number): Promise<MeetingRecordResponseType> {
    return this.meetingRecordService.getMeetingRecordById(id)
  }

  @ApiGetMeetingRecordByAppointmentId()
  @Get('appointment/:id')
  async getMeetingRecordByAppointmentId(@Param('id', ParseIntPipe) id: number): Promise<MeetingRecordResponseType | null> {
    return this.meetingRecordService.getMeetingRecordByAppointmentId(id)
  }

  @ApiGetMeetingRecordByPatientId()
  @Get('patient/:id')
  async getMeetingRecordByPatientId(@Param('id', ParseIntPipe) id: number, @Query() query: unknown): Promise<PaginatedResponse<MeetingRecordResponseType>> {
    return this.meetingRecordService.getMeetingRecordByPatientId(id, query)
  }

  @Roles(Role.Doctor, Role.Staff)
  @ApiUpdateMeetingRecord()
  @Patch(':id')
  async updateMeetingRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateMeetingRecordDto)) data: UpdateMeetingRecordDtoType,
  ): Promise<MeetingRecordResponseType> {
    return this.meetingRecordService.updateMeetingRecord(id, data)
  }

  @Roles(Role.Doctor, Role.Staff)
  @ApiDeleteMeetingRecord()
  @Delete(':id')
  async deleteMeetingRecord(@Param('id', ParseIntPipe) id: number): Promise<MeetingRecordResponseType> {
    return this.meetingRecordService.deleteMeetingRecord(id)
  }
}
