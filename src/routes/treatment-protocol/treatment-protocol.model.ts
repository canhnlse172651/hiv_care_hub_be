import { z } from 'zod'
import { MedicationSchedule } from '@prisma/client'

// Protocol Medicine schema
export const ProtocolMedicineSchema = z.object({
  medicineId: z.number().positive('Medicine ID is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  duration: z.nativeEnum(MedicationSchedule),
  notes: z.string().optional(),
})

// Treatment Protocol schemas
export const CreateTreatmentProtocolSchema = z.object({
  name: z.string().min(1, 'Protocol name is required'),
  description: z.string().optional(),
  targetDisease: z.string().min(1, 'Target disease is required'),
  medicines: z.array(ProtocolMedicineSchema).optional(),
})

export const UpdateTreatmentProtocolSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetDisease: z.string().min(1).optional(),
})

export const QueryTreatmentProtocolSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  targetDisease: z.string().optional(),
  createdById: z
    .string()
    .transform((val) => (val ? parseInt(val) : undefined))
    .optional(),
  name: z.string().optional(),
})

export const AddMedicineToProtocolSchema = z.object({
  medicineId: z.number().positive('Medicine ID is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  duration: z.nativeEnum(MedicationSchedule),
  notes: z.string().optional(),
})

export const UpdateMedicineInProtocolSchema = z.object({
  dosage: z.string().min(1).optional(),
  duration: z.nativeEnum(MedicationSchedule).optional(),
  notes: z.string().optional(),
})

export const CloneProtocolSchema = z.object({
  name: z.string().min(1, 'Protocol name is required'),
  description: z.string().optional(),
})

export const TreatmentProtocolResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  targetDisease: z.string(),
  createdById: z.number(),
  updatedById: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  medicines: z.array(
    z.object({
      id: z.number(),
      medicineId: z.number(),
      dosage: z.string(),
      duration: z.string(),
      notes: z.string().nullable(),
      medicine: z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().nullable(),
        unit: z.string(),
        dose: z.string(),
        price: z.number(),
      }),
    }),
  ),
  createdBy: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
  updatedBy: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
})
