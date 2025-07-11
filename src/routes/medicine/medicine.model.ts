import { z } from 'zod'
import { SharedSearchSchema } from '../../shared/interfaces/medication.interface'

const unitEnum = z.enum(['mg', 'g', 'ml', 'tablet', 'capsule', 'drops', 'syrup', 'injection'])

export const MedicineSchema = z.object({
  id: z.number().positive('ID must be a positive number'),
  name: z
    .string()
    .min(1, 'Medicine name is required')
    .max(500, 'Medicine name must be less than 500 characters')
    .trim()
    .refine((name) => !/^\d+$/.test(name), {
      message: 'Medicine name cannot be only numbers',
    }),
  description: z.string().max(1000, 'Description must be less than 1000 characters').nullable().optional(),
  unit: unitEnum,
  dose: z.string().min(1, 'Dose is required').max(100, 'Dose must be less than 100 characters').trim(),
  price: z
    .number()
    .min(0, 'Price must be non-negative')
    .max(999999.99, 'Price cannot exceed 999,999.99')
    .refine((price) => Number.isFinite(price), {
      message: 'Price must be a valid number',
    }),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Create Medicine Schema with business rule validations
export const CreateMedicineSchema = z.object({
  name: z
    .string()
    .min(1, 'Medicine name is required')
    .max(500, 'Medicine name must be less than 500 characters')
    .trim()
    .transform((name) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
    .refine((name) => !/^\d+$/.test(name), {
      message: 'Medicine name cannot be only numbers',
    })
    .refine((name) => !name.includes('  '), {
      message: 'Medicine name cannot contain consecutive spaces',
    }),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .transform((desc) => (desc === '' ? undefined : desc)),
  unit: unitEnum,
  dose: z
    .string()
    .min(1, 'Dose is required')
    .max(100, 'Dose must be less than 100 characters')
    .trim()
    .refine((dose) => /^[\d\s\w.,-]+$/.test(dose), {
      message: 'Dose contains invalid characters',
    }),
  price: z
    .number()
    .min(0.01, 'Price must be at least 0.01')
    .max(999999.99, 'Price cannot exceed 999,999.99')
    .refine(
      (price) => {
        const decimalPlaces = (price.toString().split('.')[1] || '').length
        return decimalPlaces <= 2
      },
      {
        message: 'Price can have at most 2 decimal places',
      },
    ),
})

// Update Medicine Schema (partial validation)
export const UpdateMedicineSchema = CreateMedicineSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// Price Range Schema for filtering
export const PriceRangeSchema = z
  .object({
    minPrice: z.preprocess(
      (v) => (typeof v === 'string' ? Number(v) : v),
      z
        .number({ invalid_type_error: 'minPrice must be a number' })
        .min(0, 'Minimum price must be non-negative')
        .max(999999.99, 'Minimum price cannot exceed 999,999.99'),
    ),
    maxPrice: z.preprocess(
      (v) => (typeof v === 'string' ? Number(v) : v),
      z
        .number({ invalid_type_error: 'maxPrice must be a number' })
        .min(0, 'Maximum price must be non-negative')
        .max(999999.99, 'Maximum price cannot exceed 999,999.99'),
    ),
  })
  .refine((data) => data.maxPrice >= data.minPrice, {
    message: 'Maximum price must be greater than or equal to minimum price',
    path: ['maxPrice'],
  })

// Advanced Search Schema
export const AdvancedSearchSchema = z
  .object({
    query: z.string().min(1, 'Search query is required').max(255, 'Search query is too long').trim().optional(),

    minPrice: z
      .preprocess(
        (v) => (typeof v === 'string' ? Number(v) : v),
        z.number().min(0, 'Minimum price must be non-negative'),
      )
      .optional(),

    maxPrice: z
      .preprocess(
        (v) => (typeof v === 'string' ? Number(v) : v),
        z.number().min(0, 'Maximum price must be non-negative'),
      )
      .optional(),

    unit: unitEnum.optional(),

    limit: z
      .preprocess(
        (v) => (typeof v === 'string' ? parseInt(v, 10) : v),
        z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
      )
      .optional()
      .default(10),

    page: z
      .preprocess((v) => (typeof v === 'string' ? parseInt(v, 10) : v), z.number().min(1, 'Page must be at least 1'))
      .optional()
      .default(1),
  })
  .catchall(z.any())
  .refine((data) => data.minPrice === undefined || data.maxPrice === undefined || data.maxPrice >= data.minPrice, {
    message: 'Maximum price must be greater than or equal to minimum price',
    path: ['maxPrice'],
  })

// Query Medicine Schema with advanced filtering
export const QueryMedicineSchema = SharedSearchSchema.extend({
  page: z
    .preprocess((v) => (typeof v === 'string' ? parseInt(v, 10) : v), z.number().min(1, 'Page must be at least 1'))
    .optional()
    .default(1),
  sortBy: z
    .enum(['name', 'price', 'createdAt', 'unit'], {
      errorMap: () => ({ message: 'Sort field must be one of: name, price, createdAt, unit' }),
    })
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Sort order must be either asc or desc' }),
    })
    .optional()
    .default('desc'),
  minPrice: z
    .preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().min(0, 'Minimum price must be non-negative'))
    .optional(),
  maxPrice: z
    .preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().min(0, 'Maximum price must be non-negative'))
    .optional(),
  unit: unitEnum.optional(),
})
  .catchall(z.any())
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.maxPrice >= data.minPrice
      }
      return true
    },
    {
      message: 'Maximum price must be greater than or equal to minimum price',
      path: ['maxPrice'],
    },
  )

// Bulk Create Schema with array validation
export const BulkCreateMedicineSchema = z.object({
  medicines: z
    .array(CreateMedicineSchema)
    .min(1, 'At least one medicine is required')
    .max(100, 'Cannot create more than 100 medicines at once')
    .refine(
      (medicines) => {
        const names = medicines.map((m) => m.name.toLowerCase())
        const uniqueNames = new Set(names)
        return uniqueNames.size === names.length
      },
      {
        message: 'Duplicate medicine names are not allowed',
      },
    ),
  skipDuplicates: z.boolean().optional().default(false),
})

// Analytics Schemas
export const MedicineStatsQuerySchema = z.object({
  includeInactive: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional()
    .default('false'),
  groupBy: z.enum(['unit', 'price', 'date']).optional().default('unit'),
})

export const PriceDistributionQuerySchema = z.object({
  buckets: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(3).max(20))
    .optional()
    .default('5'),
  customRanges: z
    .string()
    .transform((val) => {
      try {
        const parsed = JSON.parse(val)
        return z
          .array(
            z.object({
              min: z.number().min(0),
              max: z.number().min(0),
              label: z.string().min(1),
            }),
          )
          .parse(parsed)
      } catch {
        return undefined
      }
    })
    .optional(),
})

export const UnitUsageQuerySchema = z.object({
  sortBy: z.enum(['count', 'totalValue', 'averagePrice']).optional().default('count'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50))
    .optional()
    .default('10'),
})

// Export additional types
export type Medicine = z.infer<typeof MedicineSchema>
export type CreateMedicine = z.infer<typeof CreateMedicineSchema>
export type UpdateMedicine = z.infer<typeof UpdateMedicineSchema>
export type QueryMedicine = z.infer<typeof QueryMedicineSchema>
export type BulkCreateMedicine = z.infer<typeof BulkCreateMedicineSchema>
export type PriceRange = z.infer<typeof PriceRangeSchema>
export type AdvancedSearch = z.infer<typeof AdvancedSearchSchema>
export type MedicineStatsQuery = z.infer<typeof MedicineStatsQuerySchema>
export type PriceDistributionQuery = z.infer<typeof PriceDistributionQuerySchema>
export type UnitUsageQuery = z.infer<typeof UnitUsageQuerySchema>
