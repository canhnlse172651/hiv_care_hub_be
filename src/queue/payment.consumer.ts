import { Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { CANCEL_PAYMENT_JOB_NAME, PAYMENT_QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { PaymentRepo } from 'src/routes/payment/payment.repo'

@Processor(PAYMENT_QUEUE_NAME)
export class PaymentConsumer {
  constructor(private readonly paymentRepo: PaymentRepo) {}

  async process(job: Job<{ paymentId: number }>): Promise<any> {
    switch (job.name) {
      case CANCEL_PAYMENT_JOB_NAME: {
        const { paymentId } = job.data
        // Update order status to indicate it's expired/cancelled
        await this.paymentRepo.cancelPaymentAndOrder(paymentId)
        return {}
      }
      default: {
        break
      }
    }
  }
}