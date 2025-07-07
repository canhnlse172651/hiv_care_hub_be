import { createZodDto } from 'nestjs-zod'
import {
  CreateDoctorSchema,
  UpdateDoctorSchema,
  QueryDoctorSchema,
  SwapShiftsSchema,
  GetDoctorScheduleSchema,
  GenerateScheduleSchema,
  GetDoctorByDateSchema,
  ManualScheduleAssignmentSchema,
} from './doctor.model'

// Create Doctor DTO
export class CreateDoctorDto extends createZodDto(CreateDoctorSchema) {}

// Update Doctor DTO
export class UpdateDoctorDto extends createZodDto(UpdateDoctorSchema) {}

// Query Doctor DTO
export class QueryDoctorDto extends createZodDto(QueryDoctorSchema) {}

// Swap Shifts DTO
export class SwapShiftsDto extends createZodDto(SwapShiftsSchema) {}

// Get Doctor Schedule DTO
export class GetDoctorScheduleDto extends createZodDto(GetDoctorScheduleSchema) {}

// Generate Schedule DTO
export class GenerateScheduleDto extends createZodDto(GenerateScheduleSchema) {}

// Get Doctor By Date DTO
export class GetDoctorByDateDto extends createZodDto(GetDoctorByDateSchema) {}

// Manual Schedule Assignment DTO
export class ManualScheduleAssignmentDto extends createZodDto(ManualScheduleAssignmentSchema) {}
