import { createZodDto } from 'nestjs-zod'
import { CreatePatientTreatmentSchema, PatientTreatmentQuerySchema } from './patient-treatment.model'

// Create Patient Treatment DTO
export class CreatePatientTreatmentDto extends createZodDto(CreatePatientTreatmentSchema) {}

export class PatientTreatmentQueryDto extends createZodDto(PatientTreatmentQuerySchema) {}
