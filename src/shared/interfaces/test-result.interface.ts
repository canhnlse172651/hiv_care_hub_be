import { TestInterpretation, Prisma } from '@prisma/client'

export interface TestResultCreateData {
  testId: number
  userId: number
  patientTreatmentId: number
  rawResultValue: Prisma.Decimal
  interpretation: TestInterpretation
  cutOffValueUsed: Prisma.Decimal | null
  labTechId: number
  resultDate: Date
  notes?: string | null
  doctorId?: number | null
}

export interface TestResultUpdateData {
  rawResultValue?: Prisma.Decimal
  interpretation?: TestInterpretation
  cutOffValueUsed?: Prisma.Decimal | null
  notes?: string
  resultDate?: Date
  doctorId?: number | null
}

export interface TestWithQuantitativeInfo {
  id: number
  name: string
  isQuantitative: boolean
  cutOffValue: Prisma.Decimal | null
  unit: string | null
  category: string | null
  description: string | null
}
