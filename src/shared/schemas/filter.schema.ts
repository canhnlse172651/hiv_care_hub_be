import { z } from 'zod';

// Schema cơ bản cho filter
export const createFilterSchema = <T extends z.ZodType>(schema: T) => {
  return z.object({
    // Các filter cơ bản
    isActive: z.boolean().optional(),
    createdAt: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).optional(),
    
    // Filter động cho từng field
    fields: z.record(schema).optional(),
  });
};

// Types
export type FilterSchema<T> = z.infer<ReturnType<typeof createFilterSchema<z.ZodType<T>>>>; 