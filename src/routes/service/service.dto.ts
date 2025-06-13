import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ServiceType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export const ServiceSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  price: z.string(), // Decimal sẽ trả về string
  type: z.nativeEnum(ServiceType),
  description: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  imageUrl: z.string(),
  content: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateServiceSchema = z.object({
  name: z.string().min(3),
  price: z.string(),
  type: z.nativeEnum(ServiceType),
  description: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  imageUrl: z.string().optional(),
  content: z.string(),
  isActive: z.boolean().optional(),
})

export const UpdateServiceSchema = CreateServiceSchema.partial()

export class CreateServiceDto extends createZodDto(CreateServiceSchema) {
  static create(data: unknown) {
    return CreateServiceSchema.parse(data)
  }
}

export class UpdateServiceDto extends createZodDto(UpdateServiceSchema) {
  static create(data: unknown) {
    return UpdateServiceSchema.parse(data)
  }
}

export type ServiceResponseType = z.infer<typeof ServiceSchema>
export type CreateServiceDtoType = z.infer<typeof CreateServiceSchema>
export type UpdateServiceDtoType = z.infer<typeof UpdateServiceSchema>

export class ServiceResponseSwagger {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 'Khám tổng quát' })
  name: string

  @ApiProperty({ example: 'kham-tong-quat' })
  slug: string

  @ApiProperty({ example: '200000' })
  price: string

  @ApiProperty({ enum: ServiceType, example: ServiceType.TEST })
  type: ServiceType

  @ApiProperty({ example: 'Khám tổng quát cho bệnh nhân HIV' })
  description: string

  @ApiProperty({ example: '2024-06-14T08:00:00.000Z' })
  startTime: Date

  @ApiProperty({ example: '2024-06-14T09:00:00.000Z' })
  endTime: Date

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl: string

  @ApiProperty({ example: 'Nội dung chi tiết...' })
  content: string

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiProperty({ example: '2024-06-14T08:00:00.000Z' })
  createdAt: Date

  @ApiProperty({ example: '2024-06-14T08:00:00.000Z' })
  updatedAt: Date
}
