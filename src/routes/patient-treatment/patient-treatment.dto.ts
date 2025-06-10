import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  AddAdditionalMedicationSchema,
  AddAdditionalMedicationType,
  AdherenceType,
  BulkUpdateStatusSchema,
  BulkUpdateStatusType,
  CreatePatientTreatmentSchema,
  CreatePatientTreatmentType,
  CustomizeMedicationsSchema,
  CustomizeMedicationsType,
  QueryPatientTreatmentSchema,
  QueryPatientTreatmentType,
  RecordAdherenceSchema,
  RecordAdherenceType,
  RemoveMedicationSchema,
  RemoveMedicationType,
  TreatmentStatusType,
  UpdateMedicationSchema,
  UpdateMedicationType,
  UpdatePatientTreatmentSchema,
  UpdatePatientTreatmentType,
  UpdateTreatmentStatusSchema,
  UpdateTreatmentStatusType,
} from './patient-treatment.model'

// Create Patient Treatment DTO Class
export class CreatePatientTreatmentDtoClass {
  @ApiProperty({
    description: 'Patient ID',
    example: 1,
    type: 'integer',
  })
  patientId!: number

  @ApiProperty({
    description: 'Treatment Protocol ID',
    example: 1,
    type: 'integer',
  })
  protocolId!: number

  @ApiProperty({
    description: 'Treatment start date',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  startDate!: string

  @ApiPropertyOptional({
    description: 'Treatment end date',
    example: '2024-12-31T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  endDate?: string

  @ApiPropertyOptional({
    description: 'Additional notes about the treatment',
    example: 'Patient shows good response to treatment',
    maxLength: 1000,
  })
  notes?: string
}

// Update Patient Treatment DTO Class
export class UpdatePatientTreatmentDtoClass {
  @ApiPropertyOptional({
    description: 'Treatment status',
    enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'DISCONTINUED'],
    example: 'ACTIVE',
  })
  status?: TreatmentStatusType

  @ApiPropertyOptional({
    description: 'Treatment end date',
    example: '2024-12-31T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  endDate?: string

  @ApiPropertyOptional({
    description: 'Patient adherence level',
    enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
    example: 'GOOD',
  })
  adherenceLevel?: AdherenceType

  @ApiPropertyOptional({
    description: 'Additional notes about the treatment',
    example: 'Patient shows improvement',
    maxLength: 1000,
  })
  notes?: string
}

// Query Patient Treatment DTO Class
export class QueryPatientTreatmentDtoClass {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  page?: string

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    type: 'integer',
    minimum: 1,
    maximum: 100,
  })
  limit?: string

  @ApiPropertyOptional({
    description: 'Search term for patient or protocol names',
    example: 'HIV treatment',
  })
  search?: string

  @ApiPropertyOptional({
    description: 'Filter by patient ID',
    example: 1,
    type: 'integer',
  })
  patientId?: string

  @ApiPropertyOptional({
    description: 'Filter by protocol ID',
    example: 1,
    type: 'integer',
  })
  protocolId?: string

  @ApiPropertyOptional({
    description: 'Filter by treatment status',
    enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'DISCONTINUED'],
    example: 'ACTIVE',
  })
  status?: TreatmentStatusType

  @ApiPropertyOptional({
    description: 'Filter by adherence level',
    enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
    example: 'GOOD',
  })
  adherenceLevel?: AdherenceType

  @ApiPropertyOptional({
    description: 'Filter by start date from',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  startDateFrom?: string

  @ApiPropertyOptional({
    description: 'Filter by start date to',
    example: '2024-12-31T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  startDateTo?: string

  @ApiPropertyOptional({
    description: 'Filter by end date from',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  endDateFrom?: string

  @ApiPropertyOptional({
    description: 'Filter by end date to',
    example: '2024-12-31T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  endDateTo?: string

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    type: 'boolean',
  })
  isActive?: string
}

// Update Treatment Status DTO Class
export class UpdateTreatmentStatusDtoClass {
  @ApiProperty({
    description: 'New treatment status',
    enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'DISCONTINUED'],
    example: 'COMPLETED',
  })
  status!: TreatmentStatusType

  @ApiPropertyOptional({
    description: 'Notes about the status change',
    example: 'Treatment completed successfully',
    maxLength: 1000,
  })
  notes?: string
}

// Record Adherence DTO Class
export class RecordAdherenceDtoClass {
  @ApiProperty({
    description: 'Adherence level',
    enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
    example: 'GOOD',
  })
  adherenceLevel!: AdherenceType

  @ApiPropertyOptional({
    description: 'Notes about adherence',
    example: 'Patient takes medication regularly',
    maxLength: 1000,
  })
  notes?: string

  @ApiPropertyOptional({
    description: 'Date of adherence record',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  recordDate?: string
}

// Bulk Update Status DTO Class
export class BulkUpdateStatusDtoClass {
  @ApiProperty({
    description: 'Array of treatment IDs to update',
    example: [1, 2, 3],
    type: 'array',
    items: { type: 'integer' },
  })
  treatmentIds!: number[]

  @ApiProperty({
    description: 'New status for all treatments',
    enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'DISCONTINUED'],
    example: 'PAUSED',
  })
  status!: TreatmentStatusType

  @ApiPropertyOptional({
    description: 'Notes about the bulk status change',
    example: 'Paused due to side effects',
    maxLength: 1000,
  })
  notes?: string
}

// Additional Medication DTO Class
export class AdditionalMedicationDtoClass {
  @ApiProperty({
    description: 'Medicine ID',
    example: 1,
    type: 'integer',
  })
  medicineId!: number

  @ApiProperty({
    description: 'Dosage of the medication',
    example: '200mg',
  })
  dosage!: string

  @ApiProperty({
    description: 'Frequency of the medication',
    example: 'Twice daily',
  })
  frequency!: string

  @ApiPropertyOptional({
    description: 'Duration of the medication',
    example: '30 days',
  })
  duration?: string

  @ApiPropertyOptional({
    description: 'Special instructions for the medication',
    example: 'Take with food',
  })
  instructions?: string

  @ApiPropertyOptional({
    description: 'Additional notes about the medication',
    example: 'Monitor for side effects',
    maxLength: 500,
  })
  notes?: string
}

// Medication Modification DTO Class
export class MedicationModificationDtoClass {
  @ApiProperty({
    description: 'Medicine ID to modify',
    example: 1,
    type: 'integer',
  })
  medicineId!: number

  @ApiPropertyOptional({
    description: 'New dosage of the medication',
    example: '400mg',
  })
  dosage?: string

  @ApiPropertyOptional({
    description: 'New frequency of the medication',
    example: 'Once daily',
  })
  frequency?: string

  @ApiPropertyOptional({
    description: 'New duration of the medication',
    example: '60 days',
  })
  duration?: string

  @ApiPropertyOptional({
    description: 'New instructions for the medication',
    example: 'Take on empty stomach',
  })
  instructions?: string

  @ApiPropertyOptional({
    description: 'Notes about the modification',
    example: 'Reduced dose due to side effects',
    maxLength: 500,
  })
  notes?: string
}

// Removed Medication DTO Class
export class RemovedMedicationDtoClass {
  @ApiProperty({
    description: 'Medicine ID to remove',
    example: 1,
    type: 'integer',
  })
  medicineId!: number

  @ApiProperty({
    description: 'Reason for removing the medication',
    example: 'Severe side effects',
  })
  reason!: string
}

// Custom Medications Data DTO Class
export class CustomMedicationsDataDtoClass {
  @ApiPropertyOptional({
    description: 'Additional medications to add',
    type: [AdditionalMedicationDtoClass],
  })
  additionalMedications?: AdditionalMedicationDtoClass[]

  @ApiPropertyOptional({
    description: 'Modifications to existing medications',
    type: [MedicationModificationDtoClass],
  })
  modifications?: MedicationModificationDtoClass[]

  @ApiPropertyOptional({
    description: 'Medications to remove',
    type: [RemovedMedicationDtoClass],
  })
  removedMedications?: RemovedMedicationDtoClass[]
}

// Customize Medications DTO Class
export class CustomizeMedicationsDtoClass {
  @ApiProperty({
    description: 'Custom medications data',
    type: CustomMedicationsDataDtoClass,
  })
  customMedications!: CustomMedicationsDataDtoClass
}

// Add Additional Medication DTO Class
export class AddAdditionalMedicationDtoClass {
  @ApiProperty({
    description: 'Medicine ID',
    example: 1,
    type: 'integer',
  })
  medicineId!: number

  @ApiProperty({
    description: 'Dosage of the medication',
    example: '200mg',
  })
  dosage!: string

  @ApiProperty({
    description: 'Frequency of the medication',
    example: 'Twice daily',
  })
  frequency!: string

  @ApiPropertyOptional({
    description: 'Duration of the medication',
    example: '30 days',
  })
  duration?: string

  @ApiPropertyOptional({
    description: 'Special instructions for the medication',
    example: 'Take with food',
  })
  instructions?: string

  @ApiPropertyOptional({
    description: 'Additional notes about the medication',
    example: 'Monitor for side effects',
    maxLength: 500,
  })
  notes?: string
}

// Update Medication DTO Class
export class UpdateMedicationDtoClass {
  @ApiPropertyOptional({
    description: 'New dosage of the medication',
    example: '400mg',
  })
  dosage?: string

  @ApiPropertyOptional({
    description: 'New frequency of the medication',
    example: 'Once daily',
  })
  frequency?: string

  @ApiPropertyOptional({
    description: 'New duration of the medication',
    example: '60 days',
  })
  duration?: string

  @ApiPropertyOptional({
    description: 'New instructions for the medication',
    example: 'Take on empty stomach',
  })
  instructions?: string

  @ApiPropertyOptional({
    description: 'Notes about the update',
    example: 'Adjusted dose based on patient response',
    maxLength: 500,
  })
  notes?: string
}

// Remove Medication DTO Class
export class RemoveMedicationDtoClass {
  @ApiProperty({
    description: 'Reason for removing the medication',
    example: 'Severe side effects',
  })
  reason!: string
}

// Export schemas for validation
export const CreatePatientTreatmentDto = CreatePatientTreatmentSchema
export const UpdatePatientTreatmentDto = UpdatePatientTreatmentSchema
export const QueryPatientTreatmentDto = QueryPatientTreatmentSchema
export const UpdateTreatmentStatusDto = UpdateTreatmentStatusSchema
export const RecordAdherenceDto = RecordAdherenceSchema
export const BulkUpdateStatusDto = BulkUpdateStatusSchema

// Export medication customization schemas
export const CustomizeMedicationsDto = CustomizeMedicationsSchema
export const AddAdditionalMedicationDto = AddAdditionalMedicationSchema
export const UpdateMedicationDto = UpdateMedicationSchema
export const RemoveMedicationDto = RemoveMedicationSchema

// Export types
export type CreatePatientTreatmentDtoType = CreatePatientTreatmentType
export type UpdatePatientTreatmentDtoType = UpdatePatientTreatmentType
export type QueryPatientTreatmentDtoType = QueryPatientTreatmentType
export type UpdateTreatmentStatusDtoType = UpdateTreatmentStatusType
export type RecordAdherenceDtoType = RecordAdherenceType
export type BulkUpdateStatusDtoType = BulkUpdateStatusType

// Export medication customization types
export type CustomizeMedicationsDtoType = CustomizeMedicationsType
export type AddAdditionalMedicationDtoType = AddAdditionalMedicationType
export type UpdateMedicationDtoType = UpdateMedicationType
export type RemoveMedicationDtoType = RemoveMedicationType
