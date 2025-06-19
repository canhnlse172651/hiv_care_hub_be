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

// Simple Custom Medication Schema
export const SimpleCustomMedicationSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
})

// Full Custom Medication Schema
export const CustomMedicationSchema = z.object({
  medicineId: z.number().min(1, 'Medicine ID is required').optional(),
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required').optional(),
  duration: z
    .object({
      value: z.number().min(1, 'Duration value must be positive'),
      unit: z.enum(['days', 'weeks', 'months'], { required_error: 'Duration unit is required' }),
    })
    .optional(),
  notes: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
})

// Flexible Custom Medications Schema
export const FlexibleCustomMedicationsSchema = z
  .union([
    z.array(CustomMedicationSchema),
    z.object({
      additionalMeds: z.array(SimpleCustomMedicationSchema),
    }),
    z.record(z.unknown()),
  ])
  .optional()

// Base Patient Treatment Schema
export const PatientTreatmentSchema = z.object({
  id: z.number(),
  patientId: z.number(),
  protocolId: z.number(),
  doctorId: z.number(),
  customMedications: z
    .record(z.unknown()) // Only support JSON object format
    .nullable(),
  notes: z.string().nullable(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  total: z.number().min(0, 'Total must be non-negative').optional(),
})

// Query Patient Treatment Schema with explicit validation
export const QueryPatientTreatmentSchema = z.object({
  // Pagination
  page: stringToNumber.default(1),
  limit: stringToNumber.default(10),

  // Search
  search: stringValue,
  q: z.string().optional(),
  query: z.string().optional(),

  // Patient-treatment specific fields
  patientId: stringToNumberOptional,
  doctorId: stringToNumberOptional,
  protocolId: stringToNumberOptional,

  // Date filters
  startDate: dateString,
  endDate: dateString,

  // Sorting
  sortBy: z
    .enum(['startDate', 'endDate', 'total', 'createdAt', 'id', 'patientId', 'doctorId'])
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform((val) => val?.toLowerCase() as 'asc' | 'desc')
    .pipe(z.enum(['asc', 'desc']))
    .default('desc'),

  // Additional filters
  status: z.enum(['active', 'completed', 'cancelled', 'all']).optional().default('all'),
  includeDeleted: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (typeof val === 'boolean') return val
      if (typeof val === 'string') return val.toLowerCase() === 'true'
      return false
    })
    .pipe(z.boolean()),

  // Includes
  include: z
    .union([z.string().transform((val) => val.split(',')), z.array(z.string())])
    .optional()
    .default([])
    .transform((val) => (Array.isArray(val) ? val : [])),
})

// Get Patient Treatments by Patient Schema
export const GetPatientTreatmentsByPatientSchema = z.object({
  patientId: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'number' ? val : parseInt(String(val), 10)
      if (isNaN(num) || num < 1) throw new Error('Invalid patient ID')
      return num
    })
    .pipe(z.number().int().min(1)),

  page: stringToNumber.default(1),
  limit: stringToNumber.pipe(z.number().max(100)).default(10),

  sortBy: z
    .string()
    .optional()
    .default('createdAt')
    .transform((val) => {
      const validSorts = ['createdAt', 'startDate', 'endDate', 'total', 'id']
      return validSorts.includes(val) ? val : 'createdAt'
    }),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform((val) => val?.toLowerCase() as 'asc' | 'desc')
    .pipe(z.enum(['asc', 'desc']))
    .default('desc'),

  includeCompleted: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (typeof val === 'boolean') return val
      if (typeof val === 'string') return val.toLowerCase() === 'true'
      return true
    })
    .pipe(z.boolean())
    .default(true),

  startDate: dateString,
  endDate: dateString,
})

// Custom Medications Query Schema
export const CustomMedicationsQuerySchema = z.object({
  page: stringToNumber.default(1),
  limit: stringToNumber.pipe(z.number().max(100)).default(10),

  // Optional filters
  patientId: stringToNumberOptional,
  doctorId: stringToNumberOptional,
  protocolId: stringToNumberOptional,

  // Date range
  startDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => {
      if (!val) return undefined
      if (typeof val === 'string') {
        const formats = [val, `${val}T00:00:00.000Z`, `${val} 00:00:00`]
        for (const format of formats) {
          const date = new Date(format)
          if (!isNaN(date.getTime())) return date.toISOString()
        }
        return undefined
      }
      return val.toISOString()
    })
    .pipe(z.string().optional()),

  endDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => {
      if (!val) return undefined
      if (typeof val === 'string') {
        const formats = [val, `${val}T23:59:59.999Z`, `${val} 23:59:59`]
        for (const format of formats) {
          const date = new Date(format)
          if (!isNaN(date.getTime())) return date.toISOString()
        }
        return undefined
      }
      return val.toISOString()
    })
    .pipe(z.string().optional()),
})

// Patient Treatment Query Schema
export const PatientTreatmentQuerySchema = z.object({
  page: stringToNumber.default(1),
  limit: stringToNumber.pipe(z.number().max(100)).default(10),

  // Search
  search: stringValue,
  searchFields: z.array(z.string()).optional().default(['notes']),

  // Filters
  patientId: stringToNumberOptional,
  doctorId: stringToNumberOptional,
  protocolId: stringToNumberOptional,

  // Date filters
  startDate: dateString,
  endDate: dateString,

  // Cost filters
  minCost: stringToNumberOptional,
  maxCost: stringToNumberOptional,

  // Status
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
  includeDeleted: booleanValue.default(false),

  // Sorting
  sortBy: z.enum(['createdAt', 'startDate', 'endDate', 'total', 'id']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Bulk Delete Schema
export const BulkDeletePatientTreatmentSchema = z.object({
  page: stringToNumber.default(1),
  limit: stringToNumber.default(10),

  ids: z
    .union([
      z.array(z.number()),
      z.string().transform((val) => {
        try {
          const parsed = JSON.parse(val)
          return Array.isArray(parsed) ? parsed.filter((id: unknown): id is number => typeof id === 'number') : []
        } catch {
          return val.split(',').map(Number).filter(Boolean)
        }
      }),
    ])
    .optional()
    .default([]),

  // Filters for bulk operations
  patientId: stringToNumberOptional,
  doctorId: stringToNumberOptional,
  protocolId: stringToNumberOptional,

  status: z.enum(['active', 'completed', 'cancelled']).optional(),

  // Date range for bulk operations
  startDateBefore: dateString,
  startDateAfter: dateString,
  endDateBefore: dateString,
  endDateAfter: dateString,

  // Safety flags
  dryRun: booleanValue.default(false),
  force: booleanValue.default(false),
})

// Create Patient Treatment Schema
export const CreatePatientTreatmentSchema = z.object({
  patientId: z.number().int().min(1, 'Patient ID is required'),
  protocolId: z.number().int().min(1, 'Protocol ID is required'),
  doctorId: z.number().int().min(1, 'Doctor ID is required'),
  customMedications: z.record(z.unknown()).optional().default({}),
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
  total: z.number().min(0).optional(),
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

// Simplified schemas for specific endpoints

// Basic query schema for GET all patient treatments
export const BasicQueryPatientTreatmentSchema = z.object({
  page: stringToNumber.default(1),
  limit: stringToNumber.default(10),
  search: stringValue,
  sortBy: z.enum(['startDate', 'endDate', 'total', 'createdAt', 'id']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: dateString,
  endDate: dateString,
})

// Search query schema
export const SearchPatientTreatmentSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  query: z.string().optional(),
  page: stringToNumber.optional().default(1),
  limit: stringToNumber.optional().default(10),
})

// Simple query for patient treatments by patient (without patientId field since it comes from URL param)
export const SimplePatientTreatmentsByPatientSchema = z.object({
  patientId: stringToNumber,
  page: stringToNumber.default(1),
  limit: stringToNumber.default(10),
  sortBy: z.enum(['startDate', 'endDate', 'total', 'createdAt', 'id']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: dateString,
  endDate: dateString,
})

// Export types
export type PatientTreatment = z.infer<typeof PatientTreatmentSchema>
export type QueryPatientTreatment = z.infer<typeof QueryPatientTreatmentSchema>
export type CreatePatientTreatment = z.infer<typeof CreatePatientTreatmentSchema>
export type UpdatePatientTreatment = z.infer<typeof UpdatePatientTreatmentSchema>
export type CustomMedication = z.infer<typeof CustomMedicationSchema>
export type SimpleCustomMedication = z.infer<typeof SimpleCustomMedicationSchema>
export type GetPatientTreatmentsByPatient = z.infer<typeof GetPatientTreatmentsByPatientSchema>
export type CustomMedicationsQuery = z.infer<typeof CustomMedicationsQuerySchema>
export type PatientTreatmentQuery = z.infer<typeof PatientTreatmentQuerySchema>
export type BulkDeletePatientTreatment = z.infer<typeof BulkDeletePatientTreatmentSchema>
export type BulkCreatePatientTreatment = z.infer<typeof BulkCreatePatientTreatmentSchema>

// New simplified types
export type BasicQueryPatientTreatment = z.infer<typeof BasicQueryPatientTreatmentSchema>
export type SearchPatientTreatment = z.infer<typeof SearchPatientTreatmentSchema>
export type SimplePatientTreatmentsByPatient = z.infer<typeof SimplePatientTreatmentsByPatientSchema>
