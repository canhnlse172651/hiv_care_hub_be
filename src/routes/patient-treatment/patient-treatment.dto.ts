import { createZodDto } from 'nestjs-zod'
import {
  BulkCreatePatientTreatmentSchema,
  CustomMedicationsQuerySchema,
  UpdatePatientTreatmentSchema,
  PatientTreatmentQuerySchema,
  BasicQueryPatientTreatmentSchema,
  SearchPatientTreatmentSchema,
  SimplePatientTreatmentsByPatientSchema,
} from './patient-treatment.model'

// DTOs using createZodDto for automatic validation and Swagger documentation
// Only including DTOs that are actually used in the controller

// Update Patient Treatment DTO
export class UpdatePatientTreatmentDto extends createZodDto(UpdatePatientTreatmentSchema) {}

// Basic Query Patient Treatment DTO (for GET all)
export class BasicQueryPatientTreatmentDto extends createZodDto(BasicQueryPatientTreatmentSchema) {}

// Search Patient Treatment DTO
export class SearchPatientTreatmentDto extends createZodDto(SearchPatientTreatmentSchema) {}

// Simple Patient Treatments by Patient DTO (for GET by patient ID)
export class SimplePatientTreatmentsByPatientDto extends createZodDto(SimplePatientTreatmentsByPatientSchema) {}

// Bulk Create DTO
export class BulkCreatePatientTreatmentDto extends createZodDto(BulkCreatePatientTreatmentSchema) {}

// Custom Medications Query DTO
export class CustomMedicationsQueryDto extends createZodDto(CustomMedicationsQuerySchema) {}

// Patient Treatment Query DTO (for complex queries)
export class PatientTreatmentQueryDto extends createZodDto(PatientTreatmentQuerySchema) {}
