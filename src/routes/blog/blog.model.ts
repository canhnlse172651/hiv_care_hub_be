import { z } from 'zod'

export const UserResSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
})

export const CateBlogResSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
})

export const BlogSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  imageUrl: z.string().nullable(),
  authorId: z.number(),
  cateId: z.number(),
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateBlogSchema = z.object({
  title: z.string().min(3),
  content: z.string(),
  imageUrl: z.string(),
  authorId: z.number().int(),
  cateId: z.number().int(),
})

export const UpdateBlogSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  authorId: z.number().int().optional(),
  cateId: z.number().int().optional(),
  isPublished: z.boolean().optional(),
})

export const BlogResSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  imageUrl: z.string().nullable(),
  authorId: z.number(),
  cateId: z.number(),
  author: UserResSchema,
  cateBlog: CateBlogResSchema,
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const BlogFilterSchema = z
  .object({
    title: z.string().optional(),
  })
  .optional()

export const BlogSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().min(1).max(100).optional().default(50),
})
