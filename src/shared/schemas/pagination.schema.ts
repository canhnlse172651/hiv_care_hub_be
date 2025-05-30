import { z } from 'zod';
import { createFilterSchema } from './filter.schema';

// Schema cho options phân trang
export const createPaginationSchema = <T extends z.ZodType>(filterSchema: T) => {
  return z.object({
    // Pagination options
    page: z.string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1))
      .optional()
      .default('1'),
    limit: z.string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1))
      .optional()
      .default('10'),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    
    // Search options
    search: z.string().optional(),
    searchFields: z.string()
      .transform((val) => {
        if (!val) return ['name', 'description'];
        return val.split(',').map(field => field.trim());
      })
      .pipe(z.array(z.enum(['name', 'description'])))
      .optional()
      .default('name,description'),

    // Filter options
    filters: z.string()
      .transform((val) => {
        try {
          const parsed = JSON.parse(val);
          return filterSchema.parse(parsed);
        } catch {
          return {};
        }
      })
      .optional(),
  });
};

// Schema cho metadata phân trang
export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

// Schema cho response phân trang
export const paginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    meta: paginationMetaSchema,
  });

// Types từ schema
export type PaginationOptions<T> = z.infer<ReturnType<typeof createPaginationSchema<z.ZodType<T>>>>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type PaginatedResponse<T> = z.infer<ReturnType<typeof paginatedResponseSchema<z.ZodType<T>>>>; 