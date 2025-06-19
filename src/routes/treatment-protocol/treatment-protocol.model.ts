import { MedicationSchedule } from '@prisma/client'
import { z } from 'zod'
import {
  SharedBulkCreateSchema,
  SharedMedicationSchema,
  SharedSearchSchema,
} from '../../shared/interfaces/medication.interface'

// Base Treatment Protocol Schema
export const TreatmentProtocolSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  targetDisease: z.string(),
  createdById: z.number(),
  updatedById: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Protocol Medicine Schema (extends shared medication schema)
export const ProtocolMedicineSchema = SharedMedicationSchema.extend({
  id: z.number(),
  protocolId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Create Treatment Protocol Schema
export const CreateTreatmentProtocolSchema = z.object({
  name: z.string().min(1, 'Protocol name is required').max(500),
  description: z.string().optional(),
  targetDisease: z.string().min(1, 'Target disease is required').max(500),
  medicines: z
    .array(
      z.object({
        medicineId: z.number().min(1, 'Medicine ID is required'),
        dosage: z.string().min(1, 'Dosage is required').max(100),
        duration: z.nativeEnum(MedicationSchedule),
        notes: z.string().optional(),
      }),
    )
    .min(1, 'At least one medicine is required'),
})

// Update Treatment Protocol Schema
export const UpdateTreatmentProtocolSchema = z.object({
  name: z.string().min(1, 'Protocol name is required').max(500).optional(),
  description: z.string().optional(),
  targetDisease: z.string().min(1, 'Target disease is required').max(500).optional(),
  medicines: z
    .array(
      z.object({
        id: z.number().optional(), // For existing medicines
        medicineId: z.number().min(1, 'Medicine ID is required'),
        dosage: z.string().min(1, 'Dosage is required').max(100),
        duration: z.nativeEnum(MedicationSchedule),
        notes: z.string().optional(),
      }),
    )
    .optional(),
})

// Query Treatment Protocol Schema
export const QueryTreatmentProtocolSchema = z.object({
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
  search: z.string().optional(),
  targetDisease: z.string().optional(),
  sortBy: z.enum(['name', 'targetDisease', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Types
export type TreatmentProtocol = z.infer<typeof TreatmentProtocolSchema>
export type ProtocolMedicine = z.infer<typeof ProtocolMedicineSchema>
export type CreateTreatmentProtocol = z.infer<typeof CreateTreatmentProtocolSchema>
export type UpdateTreatmentProtocol = z.infer<typeof UpdateTreatmentProtocolSchema>
export type QueryTreatmentProtocol = z.infer<typeof QueryTreatmentProtocolSchema>

// Advanced Search Schema
// Advanced Search Schema (extends shared search schema)
export const AdvancedSearchTreatmentProtocolSchema = SharedSearchSchema.extend({
  targetDisease: z.string().min(1).max(255).trim().optional(),
  createdById: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  minMedicineCount: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional(),
  maxMedicineCount: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional(),
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
}).refine(
  (data) => {
    if (data.minMedicineCount !== undefined && data.maxMedicineCount !== undefined) {
      return data.maxMedicineCount >= data.minMedicineCount
    }
    return true
  },
  {
    message: 'Maximum medicine count must be greater than or equal to minimum medicine count',
    path: ['maxMedicineCount'],
  },
)

// Clone Protocol Schema
export const CloneTreatmentProtocolSchema = z.object({
  newName: z
    .string()
    .min(1, 'New name is required')
    .max(500, 'New name must be less than 500 characters')
    .trim()
    .refine((name) => !/^\d+$/.test(name), {
      message: 'Protocol name cannot be only numbers',
    }),
})

// Bulk Create Schema (extends shared bulk schema)
export const BulkCreateTreatmentProtocolSchema = SharedBulkCreateSchema.extend({
  protocols: z
    .array(CreateTreatmentProtocolSchema)
    .min(1, 'At least one protocol is required')
    .max(50, 'Cannot create more than 50 protocols at once')
    .refine(
      (protocols) => {
        const names = protocols.map((p) => p.name.toLowerCase())
        const uniqueNames = new Set(names)
        return uniqueNames.size === names.length
      },
      {
        message: 'Duplicate protocol names are not allowed',
      },
    ),
  skipDuplicates: z.boolean().optional().default(false),
})

// Find by Name Schema
export const FindTreatmentProtocolByNameSchema = z.object({
  name: z.string().min(1, 'Protocol name is required').max(500, 'Protocol name is too long').trim(),
})

// Usage Stats Query Schema
export const UsageStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeInactive: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional()
    .default('false'),
})

// Popular Protocols Query Schema
export const PopularProtocolsQuerySchema = z.object({
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('10'),
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional().default('all'),
})

// Create Custom Protocol From Treatment Schema
export const CreateCustomProtocolFromTreatmentSchema = z.object({
  name: z.string().min(1, 'Protocol name is required').max(500),
  description: z.string().optional(),
  targetDisease: z.string().min(1, 'Target disease is required').max(200),
})

// Protocol Comparison Schema
export const ProtocolComparisonSchema = z.object({
  protocolIds: z
    .array(z.number().positive('Protocol ID must be positive'))
    .min(2, 'At least 2 protocols required for comparison')
    .max(10, 'Cannot compare more than 10 protocols at once'),
})

// Protocol Trend Analysis Schema
export const ProtocolTrendAnalysisSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  disease: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50))
    .optional()
    .default('10'),
})

// Additional Types
export type AdvancedSearchTreatmentProtocol = z.infer<typeof AdvancedSearchTreatmentProtocolSchema>
export type CloneTreatmentProtocol = z.infer<typeof CloneTreatmentProtocolSchema>
export type BulkCreateTreatmentProtocol = z.infer<typeof BulkCreateTreatmentProtocolSchema>
export type FindTreatmentProtocolByName = z.infer<typeof FindTreatmentProtocolByNameSchema>
export type UsageStatsQuery = z.infer<typeof UsageStatsQuerySchema>
export type PopularProtocolsQuery = z.infer<typeof PopularProtocolsQuerySchema>
export type CreateCustomProtocolFromTreatment = z.infer<typeof CreateCustomProtocolFromTreatmentSchema>
export type ProtocolComparison = z.infer<typeof ProtocolComparisonSchema>
export type ProtocolTrendAnalysis = z.infer<typeof ProtocolTrendAnalysisSchema>
