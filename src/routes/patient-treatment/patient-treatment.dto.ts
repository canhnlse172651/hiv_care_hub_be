import { createZodDto } from 'nestjs-zod'
import {
  CreatePatientTreatmentSchema,
  GetPatientTreatmentsByPatientSchema,
  QueryPatientTreatmentSchema,
  UpdatePatientTreatmentSchema,
  BulkCreatePatientTreatmentSchema,
  DateRangeQuerySchema,
  PatientTreatmentStatsQuerySchema,
  DoctorWorkloadQuerySchema,
  CustomMedicationsQuerySchema,
  ActiveTreatmentsQuerySchema,
  SearchTreatmentsQuerySchema,
  TreatmentCostAnalysisQuerySchema,
  TreatmentComplianceQuerySchema,
} from './patient-treatment.model'

// Create Patient Treatment DTO
export class CreatePatientTreatmentDto extends createZodDto(CreatePatientTreatmentSchema) {}

// Update Patient Treatment DTO
export class UpdatePatientTreatmentDto extends createZodDto(UpdatePatientTreatmentSchema) {}

// Query Patient Treatment DTO
export class QueryPatientTreatmentDto extends createZodDto(QueryPatientTreatmentSchema) {}

// Get Patient Treatments by Patient DTO
export class GetPatientTreatmentsByPatientDto extends createZodDto(GetPatientTreatmentsByPatientSchema) {}

// Bulk Create DTO
export class BulkCreatePatientTreatmentDto extends createZodDto(BulkCreatePatientTreatmentSchema) {}

// Date Range Query DTO
export class DateRangeQueryDto extends createZodDto(DateRangeQuerySchema) {}

// Patient Treatment Stats Query DTO
export class PatientTreatmentStatsQueryDto extends createZodDto(PatientTreatmentStatsQuerySchema) {}

// Doctor Workload Query DTO
export class DoctorWorkloadQueryDto extends createZodDto(DoctorWorkloadQuerySchema) {}

// Custom Medications Query DTO
export class CustomMedicationsQueryDto extends createZodDto(CustomMedicationsQuerySchema) {}

// Active Treatments Query DTO
export class ActiveTreatmentsQueryDto extends createZodDto(ActiveTreatmentsQuerySchema) {}

// Search Treatments Query DTO
export class SearchTreatmentsQueryDto extends createZodDto(SearchTreatmentsQuerySchema) {}

// Treatment Cost Analysis Query DTO
export class TreatmentCostAnalysisQueryDto extends createZodDto(TreatmentCostAnalysisQuerySchema) {}

// Treatment Compliance Query DTO
export class TreatmentComplianceQueryDto extends createZodDto(TreatmentComplianceQuerySchema) {}
