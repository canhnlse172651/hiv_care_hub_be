import { z } from 'zod'

// Enum definitions
export const TreatmentStatusEnum = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'DISCONTINUED'])

export const AdherenceEnum = z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'])

// Base Patient Treatment Schema
export const PatientTreatmentSchema = z.object({
  id: z.number().int().positive(),
  patientId: z.number().int().positive(),
  protocolId: z.number().int().positive(),
  status: TreatmentStatusEnum,
  startDate: z.date(),
  endDate: z.date().optional(),
  adherenceLevel: AdherenceEnum.optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
})

// Create Patient Treatment Schema
export const CreatePatientTreatmentSchema = z.object({
  patientId: z.number().int().positive({
    message: 'Patient ID must be a positive integer',
  }),
  protocolId: z.number().int().positive({
    message: 'Protocol ID must be a positive integer',
  }),
  startDate: z
    .string()
    .datetime({
      message: 'Start date must be a valid ISO date string',
    })
    .transform((date) => new Date(date)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)),
  notes: z
    .string()
    .max(1000, {
      message: 'Notes cannot exceed 1000 characters',
    })
    .optional(),
})

// Update Patient Treatment Schema
export const UpdatePatientTreatmentSchema = z.object({
  status: TreatmentStatusEnum.optional(),
  endDate: z
    .string()
    .datetime()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)),
  adherenceLevel: AdherenceEnum.optional(),
  notes: z
    .string()
    .max(1000, {
      message: 'Notes cannot exceed 1000 characters',
    })
    .optional(),
})

// Query Patient Treatment Schema
export const QueryPatientTreatmentSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  search: z.string().optional(),
  patientId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  protocolId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  status: TreatmentStatusEnum.optional(),
  adherenceLevel: AdherenceEnum.optional(),
  startDateFrom: z
    .string()
    .datetime()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)),
  startDateTo: z
    .string()
    .datetime()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)),
  endDateFrom: z
    .string()
    .datetime()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)),
  endDateTo: z
    .string()
    .datetime()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val ? val === 'true' : undefined)),
})

// Update Treatment Status Schema
export const UpdateTreatmentStatusSchema = z.object({
  status: TreatmentStatusEnum,
  notes: z.string().max(1000).optional(),
})

// Record Adherence Schema
export const RecordAdherenceSchema = z.object({
  adherenceLevel: AdherenceEnum,
  notes: z.string().max(1000).optional(),
  recordDate: z
    .string()
    .datetime()
    .optional()
    .transform((date) => (date ? new Date(date) : new Date())),
})

// Bulk Update Status Schema
export const BulkUpdateStatusSchema = z.object({
  treatmentIds: z.array(z.number().int().positive()).min(1, {
    message: 'At least one treatment ID is required',
  }),
  status: TreatmentStatusEnum,
  notes: z.string().max(1000).optional(),
})

// Export type definitions
export type PatientTreatmentType = z.infer<typeof PatientTreatmentSchema>
export type CreatePatientTreatmentType = z.infer<typeof CreatePatientTreatmentSchema>
export type UpdatePatientTreatmentType = z.infer<typeof UpdatePatientTreatmentSchema>
export type QueryPatientTreatmentType = z.infer<typeof QueryPatientTreatmentSchema>
export type UpdateTreatmentStatusType = z.infer<typeof UpdateTreatmentStatusSchema>
export type RecordAdherenceType = z.infer<typeof RecordAdherenceSchema>
export type BulkUpdateStatusType = z.infer<typeof BulkUpdateStatusSchema>
export type TreatmentStatusType = z.infer<typeof TreatmentStatusEnum>
export type AdherenceType = z.infer<typeof AdherenceEnum>
