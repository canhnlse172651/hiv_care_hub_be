import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentGatewayService } from './payment-gateway.service';

export interface WebhookPayload {
  transactionId: string;
  orderId: string;
  amount: number;
  status: string;
  message: string;
  signature: string;
}

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private paymentService: PaymentService,
    private paymentGatewayService: PaymentGatewayService,
  ) {}

  async handleWebhook(payload: WebhookPayload, signature: string): Promise<void> {
    try {
      this.logger.log(`Received webhook for transaction: ${payload.transactionId}`);

      // Verify webhook signature
      const isValidSignature = this.paymentGatewayService.verifyWebhookSignature(payload, signature);
      if (!isValidSignature) {
        this.logger.error('Invalid webhook signature');
        throw new BadRequestException('Invalid signature');
      }

      // Handle different payment statuses
      switch (payload.status) {
        case 'SUCCESS':
          await this.handlePaymentSuccess(payload);
          break;
        case 'FAILED':
          await this.handlePaymentFailed(payload);
          break;
        case 'CANCELLED':
          await this.handlePaymentCancelled(payload);
          break;
        default:
          this.logger.warn(`Unknown payment status: ${payload.status}`);
      }

      this.logger.log(`Webhook processed successfully for transaction: ${payload.transactionId}`);
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      throw error;
    }
  }

  private async handlePaymentSuccess(payload: WebhookPayload): Promise<void> {
    this.logger.log(`Payment successful for transaction: ${payload.transactionId}`);
    await this.paymentService.confirmPayment(payload.orderId, payload);
  }

  private async handlePaymentFailed(payload: WebhookPayload): Promise<void> {
    this.logger.log(`Payment failed for transaction: ${payload.transactionId}`);
    // Handle failed payment logic here
  }

  private async handlePaymentCancelled(payload: WebhookPayload): Promise<void> {
    this.logger.log(`Payment cancelled for transaction: ${payload.transactionId}`);
    // Handle cancelled payment logic here
  }
} 