import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import envConfig from 'src/shared/config'

@Injectable()
export class PaymentAPIKeyGuard implements CanActivate {
  private readonly logger = new Logger(PaymentAPIKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    
    // Accept Sepay format: "Authorization: Apikey API_KEY"
    const authHeader = request.headers['authorization']
    const expectedApiKey = envConfig.PAYMENT_API_KEY || 'hivcarehub_api_key'
    const expectedAuthHeader = `Apikey ${expectedApiKey}`
    
    this.logger.log(`🔑 [API_KEY_GUARD] Received Authorization header: ${authHeader}`);
    this.logger.log(`🔑 [API_KEY_GUARD] Expected Authorization header: ${expectedAuthHeader}`);
    
    if (!authHeader || authHeader !== expectedAuthHeader) {
      this.logger.error(`❌ [API_KEY_GUARD] Invalid Authorization header provided`);
      this.logger.error(`❌ [API_KEY_GUARD] Expected: ${expectedAuthHeader}`);
      this.logger.error(`❌ [API_KEY_GUARD] Received: ${authHeader}`);
      throw new UnauthorizedException('Invalid API key')
    }
    
    this.logger.log(`✅ [API_KEY_GUARD] API key verified successfully`);
    return true
  }
}