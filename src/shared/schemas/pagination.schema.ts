import { z } from 'zod'

// Schema cho options phân trang
export const createPaginationSchema = <T extends z.ZodType>(filterSchema: T) => {
  return z.object({
    // Pagination options
    page: z
      .preprocess((val) => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().min(1))
      .optional()
      .default(1),
    limit: z
      .preprocess((val) => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().min(1))
      .optional()
      .default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

    // Search options
    search: z.string().optional(),
    searchFields: z.array(z.string()).optional().default(['name', 'description']),

    // Filter options
    filters: z
      .string()
      .transform((val) => {
        try {
          const parsed = JSON.parse(val)
          return filterSchema.parse(parsed)
        } catch {
          return {}
        }
      })
      .optional(),
  })
}

// Schema cho metadata phân trang
export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
})

// Schema cho response phân trang
export const paginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    meta: paginationMetaSchema,
  })

// Types từ schema
export type PaginationOptions<T> = Omit<
  z.infer<ReturnType<typeof createPaginationSchema<z.ZodType<T>>>>,
  'searchFields'
> & {
  searchFields?: string[]
}
export type PaginationMeta = z.infer<typeof paginationMetaSchema>
export type PaginatedResponse<T> = z.infer<ReturnType<typeof paginatedResponseSchema<z.ZodType<T>>>>
