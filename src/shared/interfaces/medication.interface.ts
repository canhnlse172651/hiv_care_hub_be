import { MedicationSchedule } from '@prisma/client'
import { z } from 'zod'

// Shared interface for medication across modules
export interface IMedication {
  medicineId: number
  dosage: string
  duration: MedicationSchedule
  notes?: string
}

// Shared interface for bulk operations
export interface IBulkCreateDto<T> {
  items: T[]
  validateBeforeCreate?: boolean
}

// Shared interface for search operations
export interface ISearchOptions {
  query?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Common medication schema that can be reused
export const SharedMedicationSchema = z.object({
  medicineId: z.number().positive('Medicine ID must be positive'),
  dosage: z.string().min(1, 'Dosage is required'),
  duration: z.nativeEnum(MedicationSchedule),
  notes: z.string().optional(),
})

// Common search schema
export const SharedSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Common bulk operation schema
export const SharedBulkCreateSchema = z.object({
  items: z.array(z.unknown()).min(1, 'At least one item is required'),
  validateBeforeCreate: z.boolean().optional().default(true),
})

export type SharedMedication = z.infer<typeof SharedMedicationSchema>
export type SharedSearch = z.infer<typeof SharedSearchSchema>
export type SharedBulkCreate = z.infer<typeof SharedBulkCreateSchema>
