import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { BullModule } from '@nestjs/bull';
import { PaymentQueueService } from './payment-queue.service';
@Module({
  imports: [
   BullModule.registerQueue({
    name: 'payment',
   }),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentGatewayService,
    PaymentWebhookService,
    PaymentQueueService,
  ],
  exports: [PaymentService, PaymentQueueService],
})
export class PaymentModule {} 