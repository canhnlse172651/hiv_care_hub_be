import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService, CreatePaymentDto } from './payment.service';
import { PaymentWebhookService, WebhookPayload } from './payment-webhook.service';
// import { PaymentQueueService } from './payment-queue.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private paymentWebhookService: PaymentWebhookService,
    // private paymentQueueService: PaymentQueueService,
  ) {}

  @Post()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Get(':id')
  async getPayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getPaymentById(id);
  }

  @Get('user/:userId')
  async getPaymentsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.paymentService.getPaymentsByUserId(userId);
  }

  @Post(':id/cancel')
  async cancelPayment(@Param('id', ParseIntPipe) id: number) {
    await this.paymentService.cancelPayment(id);
    return { message: 'Payment cancelled successfully' };
  }

  @Post('webhook')
  async handleWebhook(
    @Body() payload: WebhookPayload,
    @Headers('x-sepay-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature header');
    }

    await this.paymentWebhookService.handleWebhook(payload, signature);
    return { message: 'Webhook processed successfully' };
  }

  // Queue endpoints (COMMENTED FOR TESTING)
  /*
  @Get('queue/status')
  async getQueueStatus() {
    return this.paymentQueueService.getQueueStatus();
  }

  @Post('queue/clear')
  async clearQueue() {
    await this.paymentQueueService.clearQueue();
    return { message: 'Queue cleared successfully' };
  }
  */
} 