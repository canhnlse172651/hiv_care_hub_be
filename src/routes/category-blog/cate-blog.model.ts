import { z } from 'zod'

export const CateBlogSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateCateBlogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
})

export const UpdateCateBlogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().min(3, 'Description must be at least 3 characters').optional(),
  isPublished: z.boolean().optional(),
})

export const CateBlogResSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CateBlogFilterSchema = z
  .object({
    title: z.string().optional(),
  })
  .optional()

export const CateBlogSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().min(1).max(100).optional().default(50),
})
