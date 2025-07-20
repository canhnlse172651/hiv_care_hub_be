import { createZodDto } from 'nestjs-zod'
import { CreateMeetingRecordSchema, UpdateMeetingRecordSchema, MeetingRecordResSchema } from './meeting-record.model'
import { z } from 'zod'

export class CreateMeetingRecordDto extends createZodDto(CreateMeetingRecordSchema) {
  static create(data: unknown) {
    return CreateMeetingRecordSchema.parse(data)
  }
}

export class UpdateMeetingRecordDto extends createZodDto(UpdateMeetingRecordSchema) {
  static create(data: unknown) {
    return UpdateMeetingRecordSchema.parse(data)
  }
}

// Types
export type MeetingRecordResponseType = z.infer<typeof MeetingRecordResSchema>
export type CreateMeetingRecordDtoType = z.infer<typeof CreateMeetingRecordSchema>
export type UpdateMeetingRecordDtoType = z.infer<typeof UpdateMeetingRecordSchema>