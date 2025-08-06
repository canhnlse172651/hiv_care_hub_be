import { Controller, Post, Body, Logger, Headers, UnauthorizedException, UseGuards, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
import { PaymentService } from './payment.service'
import { WebhookPaymentBodyDTO } from './payment.dto'
import { 
  WebhookPayloadSwaggerDto, 
  WebhookResponseSwaggerDto,
  DashboardPaymentsResponseSwaggerDto,
  RevenueStatsResponseSwaggerDto
} from 'src/swagger/payment.swagger'
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard'
import { AuthType } from 'src/shared/constants/auth.constant'
import { Auth } from 'src/shared/decorators/auth.decorator'

@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  
  constructor(private readonly paymentService: PaymentService) {}

  @Get('/dashboard')
  @Auth([AuthType.Bearer])
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get all payments for revenue dashboard',
    description: 'Retrieve all payments with filtering options for admin dashboard'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (YYYY-MM-DD format)',
    example: '2024-01-01'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (YYYY-MM-DD format)',
    example: '2024-12-31'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Payment status filter',
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    example: 'SUCCESS'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 20
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payments retrieved successfully',
    type: DashboardPaymentsResponseSwaggerDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Please provide a valid Bearer token' 
  })
  async getDashboardPayments(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    this.logger.log(`📊 [DASHBOARD] Getting payments for dashboard`);
    this.logger.log(`🔍 [DASHBOARD] Filters: startDate=${startDate}, endDate=${endDate}, status=${status}`);
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    return this.paymentService.getDashboardPayments({
      startDate,
      endDate,
      status,
      page: pageNum,
      limit: limitNum
    });
  }

  @Get('/revenue-stats')
  @UseGuards(AuthenticationGuard)
  @Auth([AuthType.Bearer])
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get revenue statistics by time period',
    description: 'Get revenue statistics grouped by day, month, or year for dashboard charts'
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for grouping',
    enum: ['day', 'month', 'year'],
    example: 'month'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (YYYY-MM-DD format)',
    example: '2024-01-01'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (YYYY-MM-DD format)',
    example: '2024-12-31'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Revenue statistics retrieved successfully',
    type: RevenueStatsResponseSwaggerDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Please provide a valid Bearer token' 
  })
  async getRevenueStats(
    @Query('period') period: string = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    this.logger.log(`📈 [REVENUE_STATS] Getting revenue statistics`);
    this.logger.log(`🔍 [REVENUE_STATS] Period: ${period}, StartDate: ${startDate}, EndDate: ${endDate}`);
    
    return this.paymentService.getRevenueStats({
      period,
      startDate,
      endDate
    });
  }

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