import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { OrderProducer } from './order.producer';
import { PrismaService } from 'src/shared/services/prisma.service';
import { BullModule } from '@nestjs/bull';
import { PAYMENT_QUEUE_NAME } from 'src/shared/constants/queue.constant';

@Module({
  controllers: [OrderController],
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_QUEUE_NAME,
    }),
  ],
  providers: [OrderService, OrderRepository, OrderProducer, PrismaService],
  exports: [OrderService, OrderRepository, OrderProducer],
})
export class OrderModule {} 