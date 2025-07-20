import { Prisma, TestInterpretation } from '@prisma/client'
import { z } from 'zod'

const decimalSchema = z
  .union([z.number(), z.string().transform((val) => parseFloat(val))])
  .transform((val) => new Prisma.Decimal(val.toString()))

export const TestResultSchema = z.object({
  id: z.number(),
  testId: z.number(),
  userId: z.number(),
  patientTreatmentId: z.number(),
  rawResultValue: decimalSchema.nullable(),
  unit: z.string().nullable(),
  interpretation: z.nativeEnum(TestInterpretation).nullable(),
  cutOffValueUsed: decimalSchema.nullable(),
  labTechId: z.number().nullable(),
  resultDate: z.date().nullable(),
  createdByDoctorId: z.number().nullable(),
  notes: z.string().nullable(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateTestResultSchema = z.object({
  testId: z.number(),
  userId: z.number(),
  patientTreatmentId: z.number(),
  notes: z.string().optional(),
})

export const UpdateTestResultSchema = z.object({
  rawResultValue: z.number().optional(),
  interpretation: z.nativeEnum(TestInterpretation).optional(),
  cutOffValueUsed: z.number().optional(),
  labTechId: z.number().optional(),
  resultDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
})

export const TestResultQuerySchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  sortBy: z.enum(['createdAt', 'resultDate']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.number().optional(),
  testId: z.number().optional(),
  patientTreatmentId: z.number().optional(),
  interpretation: z.nativeEnum(TestInterpretation).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  doctorId: z.number().optional(),
  labTechId: z.number().optional(),
  search: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
})

export const TestResultWithRelationsSchema = TestResultSchema.extend({
  test: z.object({
    id: z.number(),
    name: z.string(),
    isQuantitative: z.boolean(),
    unit: z.string().optional(),
    cutOffValue: z.number().optional(),
    category: z.string().optional(),
  }),
  user: z.object({
    id: z.number(),
    fullName: z.string(),
    email: z.string(),
  }),
  patientTreatment: z.object({
    id: z.number(),
    startDate: z.date(),
    endDate: z.date().nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
  labTech: z.object({
    id: z.number(),
    fullName: z.string(),
    email: z.string(),
  }),
})

export type TestResult = z.infer<typeof TestResultSchema>
export type CreateTestResult = z.infer<typeof CreateTestResultSchema>
export type UpdateTestResult = z.infer<typeof UpdateTestResultSchema>
export type TestResultQuery = z.infer<typeof TestResultQuerySchema>
export type TestResultWithRelations = z.infer<typeof TestResultWithRelationsSchema>
export const TestFilterSchema = z.object({
  category: z.string().optional(),
  isQuantitative: z.boolean().optional(),
})

export const TestResultFilterSchema = z.object({
  userId: z.number().optional(),
  testId: z.number().optional(),
  patientTreatmentId: z.number().optional(),
  interpretation: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  labTechId: z.number().optional(),
})
