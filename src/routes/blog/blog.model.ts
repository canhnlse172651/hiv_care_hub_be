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
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(3, 'Content must be at least 3 characters'),
  imageUrl: z.string().max(500, 'Image URL must be less than 500 characters'),
  authorId: z.number().int(),
  cateId: z.number().int(),
})

export const UpdateBlogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  content: z.string().min(3, 'Content must be at least 3 characters').optional(),
  imageUrl: z.string().max(500, 'Image URL must be less than 500 characters').optional(),
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
