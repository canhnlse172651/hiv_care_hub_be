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
  title: z.string().min(3),
  description: z.string().min(3),
})

export const UpdateCateBlogSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(3).optional(),
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
