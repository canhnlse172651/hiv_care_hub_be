import { z } from 'zod'
import { ServiceType } from '@prisma/client'

export const QueryServiceSchema = z.object({
  name: z.string().optional(),
  type: z.nativeEnum(ServiceType).optional(),
  isActive: z.boolean().optional(),
  
})

export type QueryServiceType = z.infer<typeof QueryServiceSchema>
