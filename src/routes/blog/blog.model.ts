import { z } from 'zod'

export const UserResSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
})

export const BlogSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  authorId: z.number(),
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateBlogSchema = z.object({
  title: z.string().min(3),
  content: z.string(),
  authorId: z.number().int(),
})

export const UpdateBlogSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().optional(),
  authorId: z.number().int().optional(),
  isPublished: z.boolean().optional(),
})

export const BlogResSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  authorId: z.number(),
  author: UserResSchema,
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const QueryBlogSchema = z.object({
  search: z.string().optional(),
  searchFields: z
    .array(z.enum(['title']))
    .optional()
    .default(['title']),
})
