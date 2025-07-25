import { z } from 'zod'

// Helper functions for explicit validation (no dependencies on flexible.schema)
const stringToNumber = z.union([z.string(), z.number()]).transform((val) => {
  if (typeof val === 'number') return val
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
})

const stringToNumberOptional = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((val) => {
    if (val === undefined || val === null || val === '') return undefined
    if (typeof val === 'number') return val
    const parsed = parseFloat(val)
    return isNaN(parsed) ? undefined : parsed
  })
  .optional()

const dateString = z
  .union([z.string(), z.date(), z.undefined(), z.null()])
  .transform((val) => {
    if (val === undefined || val === null || val === '') return undefined
    if (val instanceof Date) return val.toISOString()
    if (typeof val === 'string') {
      try {
        return new Date(val).toISOString()
      } catch {
        return undefined
      }
    }
    return undefined
  })
  .optional()

const stringValue = z
  .union([z.string(), z.number(), z.boolean(), z.undefined(), z.null()])
  .transform((val) => {
    if (val === undefined || val === null) return undefined
    return String(val).trim() || undefined
  })
  .optional()

const booleanValue = z
  .union([z.string(), z.boolean(), z.number(), z.undefined(), z.null()])
  .transform((val) => {
    if (val === undefined || val === null || val === '') return undefined
    if (typeof val === 'boolean') return val
    if (typeof val === 'number') return val > 0
    if (typeof val === 'string') {
      const lower = val.toLowerCase()
      return ['true', '1', 'yes', 'on'].includes(lower)
    }
    return false
  })
  .optional()

export const CustomMedicationSchema = z.object({
  medicineId: z.number().min(1, 'Medicine ID is required').optional(),
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  unit: z.string().min(1, 'Unit is required').optional(),
  frequency: z.string().min(1, 'Frequency is required'),
  time: z.string().optional(),
  durationValue: z.number().min(1, 'Duration value is required and must be positive'),
  durationUnit: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR'], { required_error: 'Duration unit is required' }),
  schedule: z.enum(['MORNING', 'AFTERNOON', 'NIGHT'], { required_error: 'Schedule is required' }).optional(),
  notes: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
})

export const PatientTreatmentQuerySchema = z.object({
  page: stringToNumber.default(1),
  limit: stringToNumber.pipe(z.number().max(100)).default(10),
  search: stringValue,
  patientId: stringToNumberOptional,
  doctorId: stringToNumberOptional,
  protocolId: stringToNumberOptional,
  startDate: dateString,
  endDate: dateString,
  minCost: stringToNumberOptional,
  maxCost: stringToNumberOptional,
  status: booleanValue.optional(),
  includeDeleted: booleanValue.default(false),
  sortBy: z.enum(['createdAt', 'startDate', 'endDate', 'total', 'id']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const GetPatientTreatmentsByPatientSchema = z.object({
  patientId: stringToNumberOptional,
  page: stringToNumber.default(1),
  limit: stringToNumber.pipe(z.number().max(100)).default(10),
  sortBy: z.enum(['createdAt', 'startDate', 'endDate', 'total', 'id']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeCompleted: booleanValue.default(true),
  startDate: dateString,
  endDate: dateString,
})

export const CustomMedicationsQuerySchema = z.object({
  page: stringToNumber.default(1),
  limit: stringToNumber.pipe(z.number().max(100)).default(10),
  patientId: stringToNumberOptional,
  doctorId: stringToNumberOptional,
  protocolId: stringToNumberOptional,
  startDate: dateString,
  endDate: dateString,
})

// Create Patient Treatment Schema
export const CreatePatientTreatmentSchema = z.object({
  patientId: z.number().int().min(1, 'Patient ID is required'),
  protocolId: z.number().int().optional(), // Protocol ID is optional for custom treatments
  doctorId: z.number().int().min(1, 'Doctor ID is required'),
  customMedications: z.array(CustomMedicationSchema).optional().default([]),
  notes: z.string().optional(),
  startDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (val instanceof Date) return val
      return new Date(val)
    })
    .pipe(z.date()),
  endDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (!val) return undefined
      if (val instanceof Date) return val
      return new Date(val)
    })
    .pipe(z.date())
    .optional(),
  status: booleanValue.default(false),
})

// Update Patient Treatment Schema
export const UpdatePatientTreatmentSchema = CreatePatientTreatmentSchema.partial()

// Bulk Create Schema
export const BulkCreatePatientTreatmentSchema = z.object({
  items: z.array(CreatePatientTreatmentSchema).min(1, 'At least one item is required'),
  validateBeforeCreate: booleanValue.default(true),
  continueOnError: booleanValue.default(false),
  dryRun: booleanValue.default(false),
})

export type CreatePatientTreatmentType = z.infer<typeof CreatePatientTreatmentSchema>
export type UpdatePatientTreatment = z.infer<typeof UpdatePatientTreatmentSchema>
export type CustomMedicationType = z.infer<typeof CustomMedicationSchema>
export type BulkCreatePatientTreatment = z.infer<typeof BulkCreatePatientTreatmentSchema>
