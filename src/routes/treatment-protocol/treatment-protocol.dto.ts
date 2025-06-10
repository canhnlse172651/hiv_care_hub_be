import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
  CreateTreatmentProtocolSchema,
  UpdateTreatmentProtocolSchema,
  QueryTreatmentProtocolSchema,
  AddMedicineToProtocolSchema,
  UpdateMedicineInProtocolSchema,
  CloneProtocolSchema,
  TreatmentProtocolResponseSchema,
} from './treatment-protocol.model'

// Create Treatment Protocol DTO
export class CreateTreatmentProtocolDto extends createZodDto(CreateTreatmentProtocolSchema) {
  static create(data: unknown) {
    return CreateTreatmentProtocolSchema.parse(data)
  }
}

// Update Treatment Protocol DTO
export class UpdateTreatmentProtocolDto extends createZodDto(UpdateTreatmentProtocolSchema) {
  static create(data: unknown) {
    return UpdateTreatmentProtocolSchema.parse(data)
  }
}

// Query Treatment Protocol DTO
export class QueryTreatmentProtocolDto extends createZodDto(QueryTreatmentProtocolSchema) {
  static create(data: unknown) {
    return QueryTreatmentProtocolSchema.parse(data)
  }
}

// Add Medicine to Protocol DTO
export class AddMedicineToProtocolDto extends createZodDto(AddMedicineToProtocolSchema) {
  static create(data: unknown) {
    return AddMedicineToProtocolSchema.parse(data)
  }
}

// Update Medicine in Protocol DTO
export class UpdateMedicineInProtocolDto extends createZodDto(UpdateMedicineInProtocolSchema) {
  static create(data: unknown) {
    return UpdateMedicineInProtocolSchema.parse(data)
  }
}

// Clone Protocol DTO
export class CloneProtocolDto extends createZodDto(CloneProtocolSchema) {
  static create(data: unknown) {
    return CloneProtocolSchema.parse(data)
  }
}

// Types
export type TreatmentProtocolResponseType = z.infer<typeof TreatmentProtocolResponseSchema>
export type CreateTreatmentProtocolDtoType = z.infer<typeof CreateTreatmentProtocolSchema>
export type UpdateTreatmentProtocolDtoType = z.infer<typeof UpdateTreatmentProtocolSchema>
export type QueryTreatmentProtocolDtoType = z.infer<typeof QueryTreatmentProtocolSchema>
export type AddMedicineToProtocolDtoType = z.infer<typeof AddMedicineToProtocolSchema>
export type UpdateMedicineInProtocolDtoType = z.infer<typeof UpdateMedicineInProtocolSchema>
export type CloneProtocolDtoType = z.infer<typeof CloneProtocolSchema>
