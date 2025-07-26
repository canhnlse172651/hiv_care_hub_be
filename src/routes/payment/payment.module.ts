import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { PaymentRepo } from './payment.repo'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PaymentConsumer } from 'src/queue/payment.consumer'
import { BullModule } from '@nestjs/bull'
import { PAYMENT_QUEUE_NAME } from 'src/shared/constants/queue.constant'

@Module({
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_QUEUE_NAME,
    }),
  ],
  providers: [PaymentService, PaymentRepo, PaymentConsumer, PrismaService],
  controllers: [PaymentController],
})
export class PaymentModule {}