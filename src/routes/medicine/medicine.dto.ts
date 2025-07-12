import { createZodDto } from 'nestjs-zod'
import type { z } from 'zod'
import {
  BulkCreateMedicineSchema,
  CreateMedicineSchema,
  MedicineStatsQuerySchema,
  PriceDistributionQuerySchema,
  UnitUsageQuerySchema,
  UpdateMedicineSchema,
} from './medicine.model'

export type CreateMedicineDtoType = z.infer<typeof CreateMedicineSchema>

// Create Medicine DTO
export class CreateMedicineDto extends createZodDto(CreateMedicineSchema) {}

// Update Medicine DTO
export class UpdateMedicineDto extends createZodDto(UpdateMedicineSchema) {}

// Bulk Create DTO
export class BulkCreateMedicineDto extends createZodDto(BulkCreateMedicineSchema) {}

// Analytics DTOs
export class MedicineStatsQueryDto extends createZodDto(MedicineStatsQuerySchema) {}

export class PriceDistributionQueryDto extends createZodDto(PriceDistributionQuerySchema) {}

export class UnitUsageQueryDto extends createZodDto(UnitUsageQuerySchema) {}
