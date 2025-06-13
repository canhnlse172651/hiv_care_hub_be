import { z } from 'zod'

// Custom Medication Schema for structured medication data
export const CustomMedicationSchema = z.object({
  medicineId: z.number().min(1, 'Medicine ID is required'),
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.object({
    value: z.number().min(1, 'Duration value must be positive'),
    unit: z.enum(['days', 'weeks', 'months'], { required_error: 'Duration unit is required' }),
  }),
  notes: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
})

// Base Patient Treatment Schema
export const PatientTreatmentSchema = z.object({
  id: z.number(),
  patientId: z.number(),
  protocolId: z.number(),
  doctorId: z.number(),
  customMedications: z.array(CustomMedicationSchema).nullable(),
  notes: z.string().nullable(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  createdById: z.number(),
  total: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Create Patient Treatment Schema
export const CreatePatientTreatmentSchema = z.object({
  patientId: z.number().min(1, 'Patient ID is required'),
  protocolId: z.number().min(1, 'Protocol ID is required'),
  doctorId: z.number().min(1, 'Doctor ID is required'),
  customMedications: z.array(CustomMedicationSchema).optional(),
  notes: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  total: z.number().min(0, 'Total must be non-negative'),
})

// Update Patient Treatment Schema
export const UpdatePatientTreatmentSchema = z.object({
  protocolId: z.number().min(1, 'Protocol ID is required').optional(),
  doctorId: z.number().min(1, 'Doctor ID is required').optional(),
  customMedications: z.array(CustomMedicationSchema).optional(),
  notes: z.string().optional(),
  startDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  endDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  total: z.number().min(0, 'Total must be non-negative').optional(),
})

// Query Patient Treatment Schema
export const QueryPatientTreatmentSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('10'),
  patientId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  doctorId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  protocolId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['startDate', 'endDate', 'total', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Get Patient Treatments by Patient Schema
export const GetPatientTreatmentsByPatientSchema = z.object({
  patientId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('10'),
})

// Custom Medications Query Schema
export const CustomMedicationsQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('10'),
  patientId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  doctorId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// Active Treatments Query Schema
export const ActiveTreatmentsQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('10'),
  patientId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  doctorId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  protocolId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
})

// Search Treatments Query Schema
export const SearchTreatmentsQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('10'),
})

// Treatment Cost Analysis Query Schema
export const TreatmentCostAnalysisQuerySchema = z.object({
  patientId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  doctorId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  protocolId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// Treatment Compliance Query Schema
export const TreatmentComplianceQuerySchema = z.object({
  patientId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
})

// Types
export type CustomMedication = z.infer<typeof CustomMedicationSchema>
export type PatientTreatment = z.infer<typeof PatientTreatmentSchema>
export type CreatePatientTreatment = z.infer<typeof CreatePatientTreatmentSchema>
export type UpdatePatientTreatment = z.infer<typeof UpdatePatientTreatmentSchema>
export type QueryPatientTreatment = z.infer<typeof QueryPatientTreatmentSchema>
export type GetPatientTreatmentsByPatient = z.infer<typeof GetPatientTreatmentsByPatientSchema>
export type CustomMedicationsQuery = z.infer<typeof CustomMedicationsQuerySchema>
export type ActiveTreatmentsQuery = z.infer<typeof ActiveTreatmentsQuerySchema>
export type SearchTreatmentsQuery = z.infer<typeof SearchTreatmentsQuerySchema>
export type TreatmentCostAnalysisQuery = z.infer<typeof TreatmentCostAnalysisQuerySchema>
export type TreatmentComplianceQuery = z.infer<typeof TreatmentComplianceQuerySchema>

// Bulk Create Schema
export const BulkCreatePatientTreatmentSchema = z.object({
  treatments: z
    .array(CreatePatientTreatmentSchema)
    .min(1, 'At least one treatment is required')
    .max(50, 'Cannot create more than 50 treatments at once'),
  skipDuplicates: z.boolean().optional().default(false),
})

// Date Range Query Schema
export const DateRangeQuerySchema = z
  .object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  })

// Statistics Query Schema
export const PatientTreatmentStatsQuerySchema = z.object({
  patientId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  includeCompleted: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional()
    .default('true'),
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional().default('all'),
})

// Doctor Workload Query Schema
export const DoctorWorkloadQuerySchema = z.object({
  doctorId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  includeInactive: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional()
    .default('false'),
})

// Additional Types
export type BulkCreatePatientTreatment = z.infer<typeof BulkCreatePatientTreatmentSchema>
export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>
export type PatientTreatmentStatsQuery = z.infer<typeof PatientTreatmentStatsQuerySchema>
export type DoctorWorkloadQuery = z.infer<typeof DoctorWorkloadQuerySchema>
