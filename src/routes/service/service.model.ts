import { z } from 'zod'
import { ServiceType } from '@prisma/client'

export const ServiceResSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  price: z.string(),
  type: z.nativeEnum(ServiceType), // ✅ enum thay vì string
  description: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  imageUrl: z.string(),
  content: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateServiceReqSchema = z.object({
  name: z.string().min(3),
  price: z.string(),
  type: z.nativeEnum(ServiceType), // ✅ enum thay vì string
  description: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  imageUrl: z.string().optional(),
  content: z.string(),
  isActive: z.boolean().optional(),
})

export const UpdateServiceReqSchema = CreateServiceReqSchema.partial()

export type ServiceResType = z.infer<typeof ServiceResSchema>
export type CreateServiceReqType = z.infer<typeof CreateServiceReqSchema>
export type UpdateServiceReqType = z.infer<typeof UpdateServiceReqSchema>
