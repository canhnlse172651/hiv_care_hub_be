import { createZodDto } from 'nestjs-zod'
import {
  CateBlogFilterSchema,
  CateBlogResSchema,
  CateBlogSearchSchema,
  CreateCateBlogSchema,
  UpdateCateBlogSchema,
} from './cate-blog.model'
import { z } from 'zod'

export class CreateCateBlogDto extends createZodDto(CreateCateBlogSchema) {
  static create(data: unknown) {
    return CreateCateBlogSchema.parse(data)
  }
}

export class UpdateCateBlogDto extends createZodDto(UpdateCateBlogSchema) {
  static create(data: unknown) {
    return UpdateCateBlogSchema.parse(data)
  }
}

// Types
export type CateBlogResponseType = z.infer<typeof CateBlogResSchema>
export type CreateCateBlogDtoType = z.infer<typeof CreateCateBlogSchema>
export type UpdateCateBlogDtoType = z.infer<typeof UpdateCateBlogSchema>
export type CateBlogFilterSchemaDto = z.infer<typeof CateBlogFilterSchema>
export type CateBlogSearchSchemaDto = z.infer<typeof CateBlogSearchSchema>
