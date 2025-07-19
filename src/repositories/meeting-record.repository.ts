import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'
import { PaginationService } from 'src/shared/services/pagination.service'
import { CreateMeetingRecordDtoType, UpdateMeetingRecordDtoType } from 'src/routes/meeting-record/meeting-record.dto'
import { MeetingRecordResponseType } from 'src/routes/meeting-record/meeting-record.dto'
import { createPaginationSchema, PaginationOptions } from 'src/shared/schemas/pagination.schema'
import { PaginatedResponse } from 'src/shared/schemas/pagination.schema'
import { MeetingRecordFilterSchema } from 'src/routes/meeting-record/meeting-record.model'

@Injectable()
export class MeetingRecordRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  private readonly includeRelations = {
    recordedBy: {
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    },
    appointment: {
      select: {
        id: true,
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            price: true,
            startTime: true,
            endTime: true,
            content: true,
          },
        },
        type: true,
        notes: true,
      },
    },
  }  

  getModel() {
    return this.prisma.meetingRecord
  }

  async createMeetingRecord(data: CreateMeetingRecordDtoType): Promise<MeetingRecordResponseType> {
    const meetingRecord = await this.prisma.meetingRecord.create({ data, include: this.includeRelations })

    return meetingRecord as MeetingRecordResponseType
  }

  async findMeetingRecordsPaginated(
    options: PaginationOptions<unknown>,
  ): Promise<PaginatedResponse<MeetingRecordResponseType>> {
    const paginationSchema = createPaginationSchema(MeetingRecordFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: ['title', 'content'],
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: any = {}

    if (validatedOptions.search) {
      where.OR = (validatedOptions.searchFields || ['title', 'content']).map((field) => ({
        [field]: { contains: validatedOptions.search, mode: 'insensitive' },
      }))
    }

    // Filter functionality
    if (validatedOptions.filters) {
      const { recordedById } = validatedOptions.filters

      if (recordedById) where.recordedById = recordedById
    }

    // Sorting
    const orderBy: any = {}
    if (validatedOptions.sortBy) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder || 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    return this.paginationService.paginate(this.prisma.meetingRecord, validatedOptions, where, this.includeRelations)
  }

  async findMeetingRecordById(id: number): Promise<MeetingRecordResponseType | null> {
    const meetingRecord = await this.prisma.meetingRecord.findUnique({
      where: { id },
      include: this.includeRelations,
    })

    return meetingRecord as MeetingRecordResponseType
  }

  async findMeetingRecordByAppointmentId(id: number): Promise<MeetingRecordResponseType | null> {
    const meetingRecord = await this.prisma.meetingRecord.findUnique({
      where: { appointmentId: id },
      include: this.includeRelations,
    })
    return meetingRecord as MeetingRecordResponseType
  }

  async updateMeetingRecord(id: number, data: UpdateMeetingRecordDtoType): Promise<MeetingRecordResponseType> {
    const existingMeetingRecord = await this.findMeetingRecordById(id)
    if (!existingMeetingRecord) throw new NotFoundException('Meeting record not found')
    const meetingRecord = await this.prisma.meetingRecord.update({ where: { id }, data, include: this.includeRelations })
    return meetingRecord as MeetingRecordResponseType
  }

  async deleteMeetingRecord(id: number): Promise<MeetingRecordResponseType> {
    const existingMeetingRecord = await this.findMeetingRecordById(id)
    if (!existingMeetingRecord) throw new NotFoundException('Meeting record not found')
    const meetingRecord = await this.prisma.meetingRecord.delete({ where: { id }, include: this.includeRelations })
    return meetingRecord as MeetingRecordResponseType
  }
}
