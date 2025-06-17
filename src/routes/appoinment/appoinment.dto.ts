import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CreateAppointmentSchema, UpdateAppointmentSchema, AppointmentResSchema } from './appoinment.model'

export class CreateAppointmentDto extends createZodDto(CreateAppointmentSchema) {
  static create(data: unknown) {
    return CreateAppointmentSchema.parse(data)
  }
}

export class UpdateAppointmentDto extends createZodDto(UpdateAppointmentSchema) {
  static create(data: unknown) {
    return UpdateAppointmentSchema.parse(data)
  }
}

export type AppointmentResponseType = z.infer<typeof AppointmentResSchema>
export type CreateAppointmentDtoType = z.infer<typeof CreateAppointmentSchema>
export type UpdateAppointmentDtoType = z.infer<typeof UpdateAppointmentSchema>
