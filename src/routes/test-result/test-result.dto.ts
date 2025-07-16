import { createZodDto } from 'nestjs-zod'
import { TestInterpretation } from '@prisma/client'
import { CreateTestResultSchema, UpdateTestResultSchema, TestResultQuerySchema } from './test-result.model'

export class CreateTestResultDto extends createZodDto(CreateTestResultSchema) {}
export class UpdateTestResultDto extends createZodDto(UpdateTestResultSchema) {}
export class TestResultQueryDto extends createZodDto(TestResultQuerySchema) {}

export { TestInterpretation }
