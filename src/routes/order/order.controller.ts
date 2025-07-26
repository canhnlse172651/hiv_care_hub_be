import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { 
  CreateOrderDto, 
  UpdateOrderDto, 
  OrderResponseDto, 
  OrderDetailDto 
} from './order.dto';
import { CreateOrderSwaggerDto, OrderResponseSwaggerDto, OrderDetailSwaggerDto, UpdateOrderSwaggerDto } from 'src/swagger/payment.swagger';

@ApiTags('Orders')
@Controller('orders')
@UseInterceptors(ClassSerializerInterceptor)
export class OrderController {
  private readonly logger = new Logger(OrderController.name);
  
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new order',
    description: 'Create a new order with items and payment method'
  })
  @ApiBody({ type: CreateOrderSwaggerDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created successfully',
    type: OrderResponseSwaggerDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    this.logger.log(`🚀 [CREATE_ORDER] Starting order creation process`);
    this.logger.log(`📋 [CREATE_ORDER] Request data: ${JSON.stringify(createOrderDto, null, 2)}`);
    
    try {
      const result = await this.orderService.createOrder(createOrderDto);
      this.logger.log(`✅ [CREATE_ORDER] Order created successfully: OrderID=${result.id}, OrderCode=${result.orderCode}, TotalAmount=${result.totalAmount}`);
      this.logger.log(`💰 [CREATE_ORDER] Payment method: ${result.payments[0]?.method}, Payment status: ${result.payments[0]?.status}`);
      
      if ('paymentUrl' in result && result.paymentUrl) {
        this.logger.log(`🔗 [CREATE_ORDER] Payment URL generated: ${result.paymentUrl}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`❌ [CREATE_ORDER] Error creating order: ${error.message}`);
      this.logger.error(`📊 [CREATE_ORDER] Error details: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get order by ID',
    description: 'Retrieve detailed order information'
  })
  @ApiParam({ name: 'id', description: 'Order ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Order found',
    type: OrderDetailSwaggerDto 
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('id', ParseIntPipe) id: number): Promise<OrderDetailDto> {
    return this.orderService.getOrderById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ 
    summary: 'Get orders by user ID',
    description: 'Retrieve all orders for a specific user'
  })
  @ApiParam({ name: 'userId', description: 'User ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'User orders found',
    type: [OrderDetailSwaggerDto]
  })
  async getOrdersByUserId(@Param('userId', ParseIntPipe) userId: number): Promise<OrderDetailDto[]> {
    return this.orderService.getOrdersByUserId(userId);
  }

  @Get('code/:orderCode')
  @ApiOperation({ 
    summary: 'Get order by order code',
    description: 'Retrieve order information by order code'
  })
  @ApiParam({ name: 'orderCode', description: 'Order Code', example: 'DH1703123456789ABC' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order found',
    type: OrderDetailSwaggerDto 
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderByOrderCode(@Param('orderCode') orderCode: string): Promise<OrderDetailDto> {
    return this.orderService.getOrderByOrderCode(orderCode);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update order',
    description: 'Update order information'
  })
  @ApiParam({ name: 'id', description: 'Order ID', example: 1 })
  @ApiBody({ type: UpdateOrderSwaggerDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Order updated successfully',
    type: OrderDetailSwaggerDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto
  ): Promise<OrderDetailDto> {
    return this.orderService.updateOrder(id, updateOrderDto);
  }
} 