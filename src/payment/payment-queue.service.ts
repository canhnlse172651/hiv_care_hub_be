import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PrismaService } from 'src/shared/services/prisma.service';

export interface CancelPaymentJob {
  paymentId: number;
}

@Injectable()
export class PaymentQueueService {
  private readonly logger = new Logger(PaymentQueueService.name);

  constructor(
    @InjectQueue('payment') private paymentQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async addCancelPaymentJob(paymentId: number): Promise<void> {
    const job = await this.paymentQueue.add(
      'cancel-payment',
      { paymentId },
      {
        delay: 24 * 60 * 60 * 1000, // 24 hours
        jobId: `cancel-payment-${paymentId}`,
        removeOnComplete: true,
        removeOnFail: true,
      }
    );

    this.logger.log(`Added cancel payment job for payment ID: ${paymentId}, job ID: ${job.id}`);
  }

  async removeCancelPaymentJob(paymentId: number): Promise<void> {
    const job = await this.paymentQueue.getJob(`cancel-payment-${paymentId}`);
    if (job) {
      await job.remove();
      this.logger.log(`Removed cancel payment job for payment ID: ${paymentId}`);
    }
  }

  async processCancelPaymentJob(job: any): Promise<void> {
    const { paymentId } = job.data as CancelPaymentJob;

    try {
      this.logger.log(`Processing cancel payment job for payment ID: ${paymentId}`);

      // Check if payment still exists and is pending
      const payment = await this.prisma.paymentTransaction.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        this.logger.warn(`Payment ${paymentId} not found, skipping cancellation`);
        return;
      }

      if (payment.status !== 'PENDING') {
        this.logger.log(`Payment ${paymentId} is not pending (status: ${payment.status}), skipping cancellation`);
        return;
      }

      // Check if payment has expired
      if (payment.expiredAt && new Date() > payment.expiredAt) {
        // Cancel the payment
        await this.prisma.paymentTransaction.update({
          where: { id: paymentId },
          data: {
            status: 'EXPIRED',
          },
        });

        this.logger.log(`Payment ${paymentId} has been automatically cancelled due to expiration`);
      } else {
        this.logger.log(`Payment ${paymentId} has not expired yet, skipping cancellation`);
      }
    } catch (error) {
      this.logger.error(`Error processing cancel payment job for payment ID ${paymentId}: ${error.message}`);
      throw error;
    }
  }

  async getQueueStatus(): Promise<any> {
    const waiting = await this.paymentQueue.getWaiting();
    const active = await this.paymentQueue.getActive();
    const completed = await this.paymentQueue.getCompleted();
    const failed = await this.paymentQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async clearQueue(): Promise<void> {
    await this.paymentQueue.empty();
    this.logger.log('Payment queue cleared');
  }
} 