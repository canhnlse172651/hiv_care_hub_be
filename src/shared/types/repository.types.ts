import { z } from 'zod'

// Base Repository Options Schema
export const BaseRepositoryOptionsSchema = z.object({
  include: z.record(z.unknown()).optional(),
  select: z.record(z.boolean()).optional(),
  omit: z.record(z.boolean()).optional(),
})

// Query Parameters Schema
export const BaseQueryParamsSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
})

// Pagination Parameters Schema
export const PaginationParamsSchema = z.object({
  skip: z.number().min(0),
  take: z.number().min(1).max(100),
})

// ID Parameter Schema
export const IdParamSchema = z.union([
  z.number().positive('ID must be a positive number'),
  z
    .string()
    .min(1)
    .transform((val) => {
      const num = parseInt(val, 10)
      if (isNaN(num) || num <= 0) {
        throw new Error('ID must be a positive number')
      }
      return num
    }),
])

// Soft Delete Schema
export const SoftDeleteSchema = z.object({
  deletedAt: z.date().nullable(),
})

// Search Options Schema
export const SearchOptionsSchema = z.object({
  where: z.record(z.unknown()).optional(),
  orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
  include: z.record(z.unknown()).optional(),
  take: z.number().min(1).max(100).optional().default(50),
})

// Price Range Schema
export const PriceRangeSchema = z
  .object({
    minPrice: z.number().min(0, 'Minimum price must be non-negative'),
    maxPrice: z.number().min(0, 'Maximum price must be non-negative'),
  })
  .refine((data) => data.maxPrice >= data.minPrice, {
    message: 'Maximum price must be greater than or equal to minimum price',
  })

// Date Range Schema
export const DateRangeSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be greater than or equal to start date',
  })

// Batch Operation Result Schema
export const BatchOperationResultSchema = z.object({
  count: z.number().min(0),
})

// Error Response Schema
export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
})

// Types inferred from schemas
export type BaseRepositoryOptions = z.infer<typeof BaseRepositoryOptionsSchema>
export type BaseQueryParams = z.infer<typeof BaseQueryParamsSchema>
export type PaginationParams = z.infer<typeof PaginationParamsSchema>
export type IdParam = z.infer<typeof IdParamSchema>
export type SoftDeleteData = z.infer<typeof SoftDeleteSchema>
export type SearchOptions = z.infer<typeof SearchOptionsSchema>
export type PriceRange = z.infer<typeof PriceRangeSchema>
export type DateRange = z.infer<typeof DateRangeSchema>
export type BatchOperationResult = z.infer<typeof BatchOperationResultSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
