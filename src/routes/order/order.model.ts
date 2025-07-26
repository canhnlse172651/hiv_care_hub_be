import { z } from 'zod'
import { OrderItemType, PaymentMethod, OrderStatus, PaymentStatus } from '@prisma/client'

// Order Item Schema
export const OrderItemSchema = z.object({
  type: z.nativeEnum(OrderItemType),
  referenceId: z.number().optional(),
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
})

// Create Order Schema
export const CreateOrderSchema = z.object({
  userId: z.number().min(1, 'User ID is required'),
  appointmentId: z.number().optional(),
  patientTreatmentId: z.number().optional(),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  method: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
})

// Update Order Schema
export const UpdateOrderSchema = z.object({
  notes: z.string().optional(),
  orderStatus: z.nativeEnum(OrderStatus).optional(),
})

// Order Response Schema
export const OrderResponseSchema = z.object({
  id: z.number(),
  orderCode: z.string(),
  totalAmount: z.number(),
  orderStatus: z.nativeEnum(OrderStatus),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiredAt: z.date().nullable(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  appointment: z.object({
    id: z.number(),
    appointmentTime: z.date(),
    status: z.string(),
    service: z.object({
      name: z.string(),
    }),
  }).nullable(),
  patientTreatment: z.object({
    id: z.number(),
    startDate: z.date(),
    endDate: z.date().nullable(),
    status: z.boolean(),
  }).nullable(),
  orderDetails: z.array(z.object({
    id: z.number(),
    type: z.nativeEnum(OrderItemType),
    referenceId: z.number().nullable(),
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })),
  payments: z.array(z.object({
    id: z.number(),
    amount: z.number(),
    method: z.nativeEnum(PaymentMethod),
    status: z.nativeEnum(PaymentStatus),
    transactionCode: z.string().nullable(),
    gatewayTransactionId: z.string().nullable(),
    paidAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })),
})

// Order List Response Schema
export const OrderListResponseSchema = z.array(OrderResponseSchema)

// Order Detail Schema
export const OrderDetailSchema = z.object({
  id: z.number(),
  orderCode: z.string(),
  totalAmount: z.number(),
  orderStatus: z.nativeEnum(OrderStatus),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiredAt: z.date().nullable(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  appointment: z.object({
    id: z.number(),
    appointmentTime: z.date(),
    status: z.string(),
    service: z.object({
      name: z.string(),
    }),
  }).nullable(),
  patientTreatment: z.object({
    id: z.number(),
    startDate: z.date(),
    endDate: z.date().nullable(),
    status: z.boolean(),
  }).nullable(),
  orderDetails: z.array(z.object({
    id: z.number(),
    type: z.nativeEnum(OrderItemType),
    referenceId: z.number().nullable(),
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
  })),
  payments: z.array(z.object({
    id: z.number(),
    amount: z.number(),
    method: z.nativeEnum(PaymentMethod),
    status: z.nativeEnum(PaymentStatus),
    transactionCode: z.string().nullable(),
    gatewayTransactionId: z.string().nullable(),
    paidAt: z.date().nullable(),
  })),
})

// Types
export type CreateOrderType = z.infer<typeof CreateOrderSchema>
export type UpdateOrderType = z.infer<typeof UpdateOrderSchema>
export type OrderResponseType = z.infer<typeof OrderResponseSchema>
export type OrderListResponseType = z.infer<typeof OrderListResponseSchema>
export type OrderDetailType = z.infer<typeof OrderDetailSchema>
export type OrderItemTypeZod = z.infer<typeof OrderItemSchema> 