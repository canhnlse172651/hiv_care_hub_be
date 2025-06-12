import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
  CreateMedicineSchema,
  UpdateMedicineSchema,
  QueryMedicineSchema,
  MedicineResponseSchema,
  BulkUpdatePricesSchema,
} from './medicine.model'

// Create Medicine DTO
export class CreateMedicineDto extends createZodDto(CreateMedicineSchema) {
  static create(data: unknown) {
    return CreateMedicineSchema.parse(data)
  }
}

// Update Medicine DTO
export class UpdateMedicineDto extends createZodDto(UpdateMedicineSchema) {
  static create(data: unknown) {
    return UpdateMedicineSchema.parse(data)
  }
}

// Query Medicine DTO
export class QueryMedicineDto extends createZodDto(QueryMedicineSchema) {
  static create(data: unknown) {
    return QueryMedicineSchema.parse(data)
  }
}

// Bulk Update Prices DTO
export class BulkUpdatePricesDto extends createZodDto(BulkUpdatePricesSchema) {
  static create(data: unknown) {
    return BulkUpdatePricesSchema.parse(data)
  }
}

// Types
export type MedicineResponseType = z.infer<typeof MedicineResponseSchema>
export type CreateMedicineDtoType = z.infer<typeof CreateMedicineSchema>
export type UpdateMedicineDtoType = z.infer<typeof UpdateMedicineSchema>
export type QueryMedicineDtoType = z.infer<typeof QueryMedicineSchema>
export type BulkUpdatePricesDtoType = z.infer<typeof BulkUpdatePricesSchema>
