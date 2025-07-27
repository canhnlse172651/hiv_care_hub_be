import { AppoinmentRepository } from './../../repositories/appoinment.repository';
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { MeetingRecordRepository } from "../../repositories/meeting-record.repository";
import { PaginationService } from "src/shared/services/pagination.service";
import { CreateMeetingRecordDto, MeetingRecordResponseType, UpdateMeetingRecordDto } from "./meeting-record.dto";
import { PaginatedResponse } from "src/shared/schemas/pagination.schema";

@Injectable()
export class MeetingRecordService {
  constructor(private readonly meetingRecordRepository: MeetingRecordRepository,
    private readonly paginationService: PaginationService,
    private readonly appoinmentRepository: AppoinmentRepository,
  ) {}

  async createMeetingRecord(data: CreateMeetingRecordDto): Promise<MeetingRecordResponseType> {
    const appointment = await this.appoinmentRepository.findAppointmentById(data.appointmentId)
    if (!appointment) throw new NotFoundException('Appointment not found')
    if (appointment.type === 'OFFLINE') throw new BadRequestException('Appointment is offline')
    return await this.meetingRecordRepository.createMeetingRecord(data)
  }

  async getAllMeetingRecord(query: unknown): Promise<PaginatedResponse<MeetingRecordResponseType>> {
    const { recordedById, ...rest } = query as any
    const filters: Record<string, any> = {} 
    if (recordedById !== undefined) filters.recordedById = Number(recordedById)

    const newQuery = {
      ...rest,
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    }
    const options = this.paginationService.getPaginationOptions(newQuery)
    return await this.meetingRecordRepository.findMeetingRecordsPaginated(options)
  }

  async getMeetingRecordById(id: number): Promise<MeetingRecordResponseType> {
    const meetingRecord = await this.meetingRecordRepository.findMeetingRecordById(id)
    if (!meetingRecord) throw new NotFoundException('Meeting record not found')
    return meetingRecord
  }

  async getMeetingRecordByAppointmentId(id: number): Promise<MeetingRecordResponseType | null> {
    const meetingRecord = await this.meetingRecordRepository.findMeetingRecordByAppointmentId(id)
    // if (!meetingRecord) throw new NotFoundException('Meeting record not found')
    return meetingRecord || null
  }

  async getMeetingRecordByPatientId(id: number, query: unknown): Promise<PaginatedResponse<MeetingRecordResponseType>> {
    const options = this.paginationService.getPaginationOptions(query)
    return await this.meetingRecordRepository.findMeetingRecordByPatientId(id, options)

  }

  async updateMeetingRecord(id: number, data: UpdateMeetingRecordDto): Promise<MeetingRecordResponseType> {
    const meetingRecord = await this.meetingRecordRepository.findMeetingRecordById(id)
    if (!meetingRecord) throw new NotFoundException('Meeting record not found')
    return await this.meetingRecordRepository.updateMeetingRecord(id, data)
  }

  async deleteMeetingRecord(id: number): Promise<MeetingRecordResponseType> {
    const meetingRecord = await this.meetingRecordRepository.findMeetingRecordById(id)
    if (!meetingRecord) throw new NotFoundException('Meeting record not found')
    return await this.meetingRecordRepository.deleteMeetingRecord(id)
  }
}