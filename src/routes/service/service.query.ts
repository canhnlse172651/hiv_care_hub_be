import { z } from 'zod'
import { ServiceType } from '@prisma/client'

export const QueryServiceSchema = z.object({
  name: z.string().optional(),
  type: z.nativeEnum(ServiceType).optional(),
  isActive: z.preprocess((val) => {
    if (val === 'true') return true
    if (val === 'false') return false
    return val
  }, z.boolean().optional()),
})

export type QueryServiceType = z.infer<typeof QueryServiceSchema>
