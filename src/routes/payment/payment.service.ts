import { Injectable, Logger } from '@nestjs/common'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentRepo } from './payment.repo'
import { parseSepayTransferContent } from 'src/shared/utils/payment.utils'

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  
  constructor(private readonly paymentRepo: PaymentRepo) {}

  receiver(body: WebhookPaymentBodyType) {
    this.logger.log(`🔄 [PAYMENT_SERVICE] Processing payment webhook`);
    this.logger.log(`💰 [PAYMENT_SERVICE] Payment details: Amount=${body.transferAmount}, Code=${body.code}`);
    this.logger.log(`📝 [PAYMENT_SERVICE] Transfer content: ${body.content}`);
    
    try {
      // Parse Sepay transfer content to extract order information
      if (body.content) {
        const transferContentInfo = parseSepayTransferContent(body.content);
        this.logger.log(`📋 [PAYMENT_SERVICE] Transfer content parsing result: ${JSON.stringify(transferContentInfo, null, 2)}`);
        
        if (transferContentInfo.isValid) {
          this.logger.log(`✅ [PAYMENT_SERVICE] Transfer content is valid`);
          this.logger.log(`🔍 [PAYMENT_SERVICE] Prefix: ${transferContentInfo.prefix}, Suffix: ${transferContentInfo.suffix}`);
        } else {
          this.logger.warn(`⚠️ [PAYMENT_SERVICE] Transfer content format is invalid: ${body.content}`);
        }
      } else {
        this.logger.warn(`⚠️ [PAYMENT_SERVICE] No transfer content provided`);
      }
      
      const result = this.paymentRepo.receiver(body);
      this.logger.log(`✅ [PAYMENT_SERVICE] Payment processed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`❌ [PAYMENT_SERVICE] Error processing payment: ${error.message}`);
      this.logger.error(`📊 [PAYMENT_SERVICE] Error details: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }
}