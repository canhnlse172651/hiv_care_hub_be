import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PaymentQueueService, CancelPaymentJob } from './payment-queue.service';

@Processor('payment')
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(private paymentQueueService: PaymentQueueService) {}

  @Process('cancel-payment')
  async handleCancelPayment(job: Job<CancelPaymentJob>) {
    this.logger.log(`Processing cancel payment job: ${job.id}`);
    
    try {
      await this.paymentQueueService.processCancelPaymentJob(job);
      this.logger.log(`Successfully processed cancel payment job: ${job.id}`);
    } catch (error) {
      this.logger.error(`Error processing cancel payment job ${job.id}: ${error.message}`);
      throw error;
    }
  }
} 