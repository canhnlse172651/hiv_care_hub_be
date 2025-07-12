import { MedicationSchedule } from '@prisma/client'
import { z } from 'zod'

// Common medication schema with explicit validation
export const SharedMedicationSchema = z.object({
  medicineId: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'number') return val
    const parsed = parseFloat(val)
    return isNaN(parsed) ? 0 : parsed
  }),
  dosage: z.union([z.string(), z.number(), z.boolean(), z.undefined(), z.null()]).transform((val) => {
    if (val === undefined || val === null) return ''
    return String(val).trim() || ''
  }),
  duration: z.union([z.nativeEnum(MedicationSchedule), z.string()]).transform((val): MedicationSchedule => {
    if (typeof val === 'string') {
      return Object.values(MedicationSchedule).includes(val as MedicationSchedule)
        ? (val as MedicationSchedule)
        : MedicationSchedule.MORNING
    }
    return val
  }),
  notes: z
    .union([z.string(), z.number(), z.boolean(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return undefined
      return String(val).trim() || undefined
    })
    .optional(),
})

// Explicit search schema
export const SharedSearchSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === 'number') return val
      const parsed = parseFloat(val)
      return isNaN(parsed) ? 1 : parsed
    })
    .default(1),
  limit: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === 'number') return val
      const parsed = parseFloat(val)
      return isNaN(parsed) ? 10 : parsed
    })
    .default(10),
  sortBy: z
    .union([z.string(), z.number(), z.boolean(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return undefined
      return String(val).trim() || undefined
    })
    .optional(),
  sortOrder: z
    .union([z.string(), z.number(), z.boolean(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return undefined
      return String(val).trim() || undefined
    })
    .optional(),
})

// Explicit bulk operation schema
export const SharedBulkCreateSchema = z.object({
  items: z.union([z.array(z.unknown()), z.string(), z.undefined(), z.null()]).transform((val): unknown[] => {
    if (val === undefined || val === null) return []
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? (parsed as unknown[]) : [val as unknown]
      } catch {
        return val
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean) as unknown[]
      }
    }
    return []
  }),
  validateBeforeCreate: z
    .union([z.string(), z.boolean(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null || val === '') return true
      if (typeof val === 'boolean') return val
      if (typeof val === 'number') return val > 0
      if (typeof val === 'string') {
        const lower = val.toLowerCase()
        return ['true', '1', 'yes', 'on'].includes(lower)
      }
      return true
    })
    .default(true),
})
