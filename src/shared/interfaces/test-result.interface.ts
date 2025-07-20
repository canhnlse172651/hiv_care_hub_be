import { TestInterpretation, Prisma } from '@prisma/client'

export interface TestResultCreateData {
  testId: number
  userId: number
  patientTreatmentId: number
  rawResultValue: Prisma.Decimal | null
  interpretation: TestInterpretation
  cutOffValueUsed: Prisma.Decimal | null
  unit?: string | null
  labTechId: number | null
  resultDate: Date | null
  notes?: string | null
  status: string
  createdByDoctorId?: number | null
}

export interface TestResultUpdateData {
  rawResultValue?: Prisma.Decimal
  interpretation?: TestInterpretation
  cutOffValueUsed?: Prisma.Decimal | null
  labTechId?: number
  notes?: string
  resultDate?: Date
  status?: string
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
