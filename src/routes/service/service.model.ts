import { z } from 'zod'
import { ServiceType } from '@prisma/client'

export const ServiceResSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  price: z.string(),
  type: z.nativeEnum(ServiceType), // ✅ enum thay vì string
  description: z.string(),
  startTime: z.string(), // trả về string HH:mm
  endTime: z.string(), // trả về string HH:mm
  imageUrl: z.string(),
  duration: z.string(), // có thể null hoặc undefined
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
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // chỉ nhận giờ HH:mm
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // chỉ nhận giờ HH:mm
  duration: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  imageUrl: z.string().optional(),
  content: z.string(),
  isActive: z.boolean().optional(),
})

export const UpdateServiceReqSchema = CreateServiceReqSchema.partial()

export type ServiceResType = z.infer<typeof ServiceResSchema>
export type CreateServiceReqType = z.infer<typeof CreateServiceReqSchema>
export type UpdateServiceReqType = z.infer<typeof UpdateServiceReqSchema>
