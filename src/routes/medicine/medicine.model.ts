import { z } from 'zod'

// Medicine schemas
export const CreateMedicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  dose: z.string().min(1, 'Dose is required'),
  price: z.number().positive('Price must be positive'),
})

export const UpdateMedicineSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.string().min(1).optional(),
  dose: z.string().min(1).optional(),
  price: z.number().positive().optional(),
})

export const QueryMedicineSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  name: z.string().optional(),
  unit: z.string().optional(),
  priceMin: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .optional(),
  priceMax: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .optional(),
})

export const MedicineResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string(),
  dose: z.string(),
  price: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const BulkUpdatePricesSchema = z.object({
  updates: z.array(
    z.object({
      id: z.number(),
      price: z.number().positive(),
    }),
  ),
})

// Usage stats schema
export const MedicineUsageStatsSchema = z.object({
  medicine: MedicineResponseSchema,
  usageCount: z.number(),
  usedInProtocols: z.array(
    z.object({
      protocolId: z.number(),
      protocolName: z.string(),
      targetDisease: z.string(),
      dosage: z.string(),
      duration: z.string(),
    }),
  ),
})
