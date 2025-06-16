import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CreateBlogSchema, UpdateBlogSchema, BlogResSchema, BlogFilterSchema, BlogSearchSchema } from './blog.model'

// Create Blog DTO
export class CreateBlogDto extends createZodDto(CreateBlogSchema) {
  static create(data: unknown) {
    return CreateBlogSchema.parse(data)
  }
}

// Update Blog DTO
export class UpdateBlogDto extends createZodDto(UpdateBlogSchema) {
  static create(data: unknown) {
    return UpdateBlogSchema.parse(data)
  }
}

//Types
export type BlogResponseType = z.infer<typeof BlogResSchema>
export type CreateBlogDtoType = z.infer<typeof CreateBlogSchema>
export type UpdateBlogDtoType = z.infer<typeof UpdateBlogSchema>
export type BlogFilterSchemaDto = z.infer<typeof BlogFilterSchema>
export type BlogSearchSchemaDto = z.infer<typeof BlogSearchSchema>
