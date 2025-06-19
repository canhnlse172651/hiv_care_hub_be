import { createZodDto } from 'nestjs-zod'
import {
  AdvancedSearchTreatmentProtocolSchema,
  BulkCreateTreatmentProtocolSchema,
  CloneTreatmentProtocolSchema,
  CreateCustomProtocolFromTreatmentSchema,
  CreateTreatmentProtocolSchema,
  FindTreatmentProtocolByNameSchema,
  PopularProtocolsQuerySchema,
  ProtocolComparisonSchema,
  ProtocolTrendAnalysisSchema,
  QueryTreatmentProtocolSchema,
  UpdateTreatmentProtocolSchema,
  UsageStatsQuerySchema,
} from './treatment-protocol.model'

// Create Treatment Protocol DTO
export class CreateTreatmentProtocolDto extends createZodDto(CreateTreatmentProtocolSchema) {}

// Update Treatment Protocol DTO
export class UpdateTreatmentProtocolDto extends createZodDto(UpdateTreatmentProtocolSchema) {}

// Query Treatment Protocol DTO
export class QueryTreatmentProtocolDto extends createZodDto(QueryTreatmentProtocolSchema) {}

// Advanced Search DTO
export class AdvancedSearchTreatmentProtocolDto extends createZodDto(AdvancedSearchTreatmentProtocolSchema) {}

// Clone Protocol DTO
export class CloneTreatmentProtocolDto extends createZodDto(CloneTreatmentProtocolSchema) {}

// Bulk Create DTO
export class BulkCreateTreatmentProtocolDto extends createZodDto(BulkCreateTreatmentProtocolSchema) {}

// Find by Name DTO
export class FindTreatmentProtocolByNameDto extends createZodDto(FindTreatmentProtocolByNameSchema) {}

// Usage Stats Query DTO
export class UsageStatsQueryDto extends createZodDto(UsageStatsQuerySchema) {}

// Popular Protocols Query DTO
export class PopularProtocolsQueryDto extends createZodDto(PopularProtocolsQuerySchema) {}

// Create Custom Protocol From Treatment DTO
export class CreateCustomProtocolFromTreatmentDto extends createZodDto(CreateCustomProtocolFromTreatmentSchema) {}

// Protocol Comparison DTO
export class ProtocolComparisonDto extends createZodDto(ProtocolComparisonSchema) {}

// Protocol Trend Analysis DTO
export class ProtocolTrendAnalysisDto extends createZodDto(ProtocolTrendAnalysisSchema) {}
