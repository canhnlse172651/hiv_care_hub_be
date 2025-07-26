import { Controller, Post, Body, Logger, Headers, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger'
import { PaymentService } from './payment.service'
import { WebhookPaymentBodyDTO } from './payment.dto'
import { WebhookPayloadSwaggerDto, WebhookResponseSwaggerDto } from 'src/swagger/payment.swagger'
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard'
import { AuthType } from 'src/shared/constants/auth.constant'
import { Auth } from 'src/shared/decorators/auth.decorator'

@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/receiver')
  @UseGuards(AuthenticationGuard)
  @Auth([AuthType.APIKey])
  @ApiOperation({ 
    summary: 'Handle Sepay webhook',
    description: 'Process webhook calls from Sepay payment gateway. This endpoint receives real-time notifications when users complete bank transfers.'
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Sepay API Key for authentication (format: Apikey YOUR_API_KEY)',
    example: 'Apikey hivcarehub_api_key'
  })
  @ApiBody({ 
    type: WebhookPayloadSwaggerDto,
    description: 'Webhook payload from Sepay containing bank transfer details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully',
    type: WebhookResponseSwaggerDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid webhook data or amount mismatch' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid API key' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Payment not found' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  receiver(
    @Body() body: WebhookPaymentBodyDTO,
    @Headers('authorization') authHeader: string
  ) {
    this.logger.log(`📥 [PAYMENT_WEBHOOK] Received webhook from Sepay`);
    this.logger.log(`📋 [PAYMENT_WEBHOOK] Webhook data: ${JSON.stringify(body, null, 2)}`);
    this.logger.log(`🔑 [PAYMENT_WEBHOOK] Authorization header: ${authHeader}`);
    
    try {
      const validatedData = WebhookPaymentBodyDTO.create(body);
      this.logger.log(`✅ [PAYMENT_WEBHOOK] Webhook data validated successfully`);
      
      const result = this.paymentService.receiver(validatedData);
      this.logger.log(`✅ [PAYMENT_WEBHOOK] Webhook processed successfully`);
      
      return result;
    } catch (error) {
      this.logger.error(`❌ [PAYMENT_WEBHOOK] Error processing webhook: ${error.message}`);
      this.logger.error(`📊 [PAYMENT_WEBHOOK] Error details: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }
}