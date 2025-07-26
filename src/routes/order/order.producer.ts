import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Queue } from 'bull'
import { generateCancelPaymentJobId } from 'src/shared/helpers'
import { PAYMENT_QUEUE_NAME, CANCEL_PAYMENT_JOB_NAME } from 'src/shared/constants/queue.constant'

@Injectable()
export class OrderProducer {
  private readonly logger = new Logger(OrderProducer.name);

  constructor(@InjectQueue(PAYMENT_QUEUE_NAME) private paymentQueue: Queue) {}

  async addCancelPaymentJob(paymentId: number) {
    this.logger.log(`🔄 [ORDER_PRODUCER] Adding cancel payment job to queue`);
    this.logger.log(`💳 [ORDER_PRODUCER] Payment ID: ${paymentId}`);
    
    try {
      const jobId = generateCancelPaymentJobId(paymentId);
      this.logger.log(`🆔 [ORDER_PRODUCER] Generated job ID: ${jobId}`);
      
      const job = await this.paymentQueue.add(
        CANCEL_PAYMENT_JOB_NAME,
        { 
          paymentId,
        },
        {
          delay: 1000 * 60 * 60 * 24, // delay 24h
          jobId: jobId,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      
      this.logger.log(`✅ [ORDER_PRODUCER] Cancel payment job added successfully: JobID=${job.id}, PaymentID=${paymentId}`);
      this.logger.log(`⏰ [ORDER_PRODUCER] Job scheduled for 24 hours from now`);
      
      return job;
    } catch (error) {
      this.logger.error(`❌ [ORDER_PRODUCER] Error adding cancel payment job: ${error.message}`);
      this.logger.error(`📊 [ORDER_PRODUCER] Error details: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }
}