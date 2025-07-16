import { createZodDto } from 'nestjs-zod'
import { CreateTestSchema, UpdateTestSchema } from './test.model'

export class CreateTestDto extends createZodDto(CreateTestSchema) {}
export class UpdateTestDto extends createZodDto(UpdateTestSchema) {}

export type CreateTestDtoType = CreateTestDto
export type UpdateTestDtoType = UpdateTestDto
