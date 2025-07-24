import { createZodDto } from 'nestjs-zod'
import {
  CreatePatientTreatmentSchema,
  PatientTreatmentQuerySchema,
  UpdatePatientTreatmentSchema,
} from './patient-treatment.model'

// Create Patient Treatment DTO
export class CreatePatientTreatmentDto extends createZodDto(CreatePatientTreatmentSchema) {}
export class UpdatePatientTreatmentDto extends createZodDto(UpdatePatientTreatmentSchema) {}
export class PatientTreatmentQueryDto extends createZodDto(PatientTreatmentQuerySchema) {}
