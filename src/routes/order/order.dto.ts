import { createZodDto } from 'nestjs-zod';
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderResponseSchema,
  OrderListResponseSchema,
  OrderDetailSchema,
} from './order.model';

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {
  static create(data: unknown) {
    return CreateOrderSchema.parse(data);
  }
}

export class UpdateOrderDto extends createZodDto(UpdateOrderSchema) {
  static create(data: unknown) {
    return UpdateOrderSchema.parse(data);
  }
}

export class OrderResponseDto extends createZodDto(OrderResponseSchema) {
  static create(data: unknown) {
    return OrderResponseSchema.parse(data);
  }
}

export class OrderListResponseDto extends createZodDto(OrderListResponseSchema) {
  static create(data: unknown) {
    return OrderListResponseSchema.parse(data);
  }
}

export class OrderDetailDto extends createZodDto(OrderDetailSchema) {
  static create(data: unknown) {
    return OrderDetailSchema.parse(data);
  }
} 