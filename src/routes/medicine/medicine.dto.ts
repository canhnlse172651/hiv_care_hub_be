import { createZodDto } from 'nestjs-zod'
import {
  CreateMedicineSchema,
  MedicineStatsQuerySchema,
  PriceDistributionQuerySchema,
  QueryMedicineSchema,
  UnitUsageQuerySchema,
  UpdateMedicineSchema,
} from './medicine.model'

// Create Medicine DTO
export class CreateMedicineDto extends createZodDto(CreateMedicineSchema) {}

// Update Medicine DTO
export class UpdateMedicineDto extends createZodDto(UpdateMedicineSchema) {}

// Query Medicine DTO
export class QueryMedicineDto extends createZodDto(QueryMedicineSchema) {}

// Analytics DTOs
export class MedicineStatsQueryDto extends createZodDto(MedicineStatsQuerySchema) {}

export class PriceDistributionQueryDto extends createZodDto(PriceDistributionQuerySchema) {}

export class UnitUsageQueryDto extends createZodDto(UnitUsageQuerySchema) {}
