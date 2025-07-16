import { Prisma } from '@prisma/client'
import { z } from 'zod'

const decimalSchema = z
  .union([z.number(), z.string().transform((val) => parseFloat(val))])
  .transform((val) => new Prisma.Decimal(val.toString()))

export const TestSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  method: z.string().nullable(),
  category: z.enum(['GENERAL', 'STD', 'HEPATITIS', 'IMMUNOLOGY']).nullable(),
  isQuantitative: z.boolean().default(false),
  unit: z.string().nullable(),
  cutOffValue: decimalSchema.nullable(),
  price: decimalSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateTestSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  description: z.string().optional(),
  method: z.string().optional(),
  category: z.enum(['GENERAL', 'STD', 'HEPATITIS', 'IMMUNOLOGY']).optional(),
  isQuantitative: z.boolean().default(false),
  unit: z.string().optional(),
  cutOffValue: z.number().optional(),
  price: z.number().positive('Price must be positive'),
})

export const UpdateTestSchema = CreateTestSchema.partial()

export const TestFilterSchema = z
  .object({
    search: z.string().optional(),
    category: z.enum(['GENERAL', 'STD', 'HEPATITIS', 'IMMUNOLOGY']).optional(),
    isQuantitative: z.boolean().optional(),
  })
  .optional()

export type TestType = z.infer<typeof TestSchema>
export type CreateTestType = z.infer<typeof CreateTestSchema>
export type UpdateTestType = z.infer<typeof UpdateTestSchema>
export type TestFilterType = z.infer<typeof TestFilterSchema>
