import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { UserResSchema, QueryUserSchema, CreateUserSchema, UpdateUserSchema } from './user.model'



// Create User DTO
export class CreateUserDto extends createZodDto(CreateUserSchema) {
  static create(data: unknown) {
    return CreateUserSchema.parse(data);
  }
}

// Update User DTO
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {
  static create(data: unknown) {
    return UpdateUserSchema.parse(data);
  }
}

// Query User DTO
export class QueryUserDto extends createZodDto(QueryUserSchema) {
  static create(data: unknown) {
    return QueryUserSchema.parse(data);
  }
}

// Types
export type UserResponseType = z.infer<typeof UserResSchema>
export type CreateUserDtoType = z.infer<typeof CreateUserSchema>
export type UpdateUserDtoType = z.infer<typeof UpdateUserSchema>
export type QueryUserDtoType = z.infer<typeof QueryUserSchema>
