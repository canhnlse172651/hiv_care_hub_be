import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam,
  ApiHeader,
  ApiProperty 
} from '@nestjs/swagger';
import { PaymentMethod, OrderItemType, OrderStatus, PaymentStatus } from '@prisma/client';

// DTOs for Swagger documentation
export class OrderItemSwaggerDto {
  @ApiProperty({ 
    example: 'APPOINTMENT_FEE',
    enum: ['APPOINTMENT_FEE', 'MEDICINE', 'TEST', 'CONSULTATION', 'TREATMENT'],
    description: 'Type of order item'
  })
  type: OrderItemType;

  @ApiProperty({ 
    example: 1,
    required: false,
    description: 'Reference ID (optional)'
  })
  referenceId?: number;

  @ApiProperty({ 
    example: 'Phí tư vấn khám bệnh HIV',
    description: 'Item name'
  })
  name: string;

  @ApiProperty({ 
    example: 1,
    minimum: 1,
    description: 'Quantity'
  })
  quantity: number;

  @ApiProperty({ 
    example: 200000,
    minimum: 0,
    description: 'Unit price in VND'
  })
  unitPrice: number;
}

export class CreateOrderSwaggerDto {
  @ApiProperty({ 
    example: 1, 
    description: 'User ID',
    minimum: 1
  })
  userId: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Appointment ID (optional)', 
    required: false,
    minimum: 1
  })
  appointmentId?: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Patient Treatment ID (optional)', 
    required: false,
    minimum: 1
  })
  patientTreatmentId?: number;

  @ApiProperty({ 
    example: [
      {
        type: 'APPOINTMENT_FEE',
        referenceId: 1,
        name: 'Phí tư vấn khám bệnh HIV',
        quantity: 1,
        unitPrice: 200000
      }
    ],
    description: 'Order items array',
    type: 'array'
  })
  items: OrderItemSwaggerDto[];

  @ApiProperty({ 
    example: 'BANK_TRANSFER',
    description: 'Payment method',
    enum: Object.values(PaymentMethod)
  })
  method: PaymentMethod;

  @ApiProperty({ 
    example: 'Đơn hàng khám và điều trị HIV - Lần tư vấn đầu tiên', 
    required: false,
    description: 'Order notes'
  })
  notes?: string;
}

export class UpdateOrderSwaggerDto {
  @ApiProperty({ 
    example: 'Đơn hàng khám và điều trị HIV - Cập nhật thông tin', 
    required: false,
    description: 'Order notes'
  })
  notes?: string;
}

export class OrderResponseSwaggerDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'DH1703123456789ABC' })
  orderCode: string;

  @ApiProperty({ example: 1150000 })
  totalAmount: number;

  @ApiProperty({ example: 'PENDING' })
  orderStatus: string;

  @ApiProperty({ example: '2023-12-20T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2023-12-21T10:30:00Z' })
  expiredAt: string;

  @ApiProperty({
    example: [
      {
        id: 1,
        type: 'APPOINTMENT_FEE',
        name: 'Phí tư vấn khám bệnh HIV',
        quantity: 1,
        unitPrice: 200000,
        totalPrice: 200000
      }
    ]
  })
  orderDetails: any[];

  @ApiProperty({
    example: {
      id: 1,
      transactionCode: 'PAY1703123456789ABC',
      amount: 1150000,
      status: 'PENDING',
      method: 'BANK_TRANSFER'
    }
  })
  payment: any;

  @ApiProperty({ 
    example: 'https://qr.sepay.vn/img?acc=3991190703&bank=Techcombank&amount=1150000&des=PAY1703123456789ABC', 
    required: false,
    description: 'Sepay QR code URL for bank transfer (for BANK_TRANSFER method)'
  })
  paymentUrl?: string;

  @ApiProperty({ 
    example: {
      accountNumber: '3991190703',
      accountName: 'HIV CARE HUB',
      bankName: 'Techcombank',
      amount: '1150000',
      content: 'PAY1703123456789ABC'
    },
    required: false,
    description: 'Bank transfer information (for BANK_TRANSFER method)'
  })
  bankInfo?: any;
}

export class PaymentResponseSwaggerDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'PAY1703123456789ABC' })
  transactionCode: string;

  @ApiProperty({ example: 1150000 })
  amount: number;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ 
    example: 'https://qr.sepay.vn/img?acc=3991190703&bank=Techcombank&amount=1150000&des=PAY1703123456789ABC', 
    required: false,
    description: 'Sepay QR code URL for bank transfer (for BANK_TRANSFER method)'
  })
  paymentUrl?: string;

  @ApiProperty({ 
    example: 'BANK_PAY1703123456789ABC', 
    required: false,
    description: 'Gateway transaction ID (BANK_ prefix for bank transfer)'
  })
  gatewayTransactionId?: string;

  @ApiProperty({
    example: {
      accountNumber: '3991190703',
      accountName: 'HIV CARE HUB',
      bankName: 'Techcombank',
      content: 'PAY1703123456789ABC'
    },
    required: false,
    description: 'Bank transfer information (for BANK_TRANSFER method)'
  })
  bankInfo?: any;
}

export class OrderDetailSwaggerDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'DH1703123456789ABC' })
  orderCode: string;

  @ApiProperty({ example: 1150000 })
  totalAmount: number;

  @ApiProperty({ example: 'PENDING' })
  orderStatus: string;

  @ApiProperty({ example: 'BANK_TRANSFER' })
  paymentMethod: string;

  @ApiProperty({ example: '2023-12-20T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2023-12-21T10:30:00Z' })
  expiredAt: string;

  @ApiProperty({ example: '2023-12-20T11:30:00Z', required: false })
  paidAt?: string;

  @ApiProperty({ example: 'SEP123456', required: false })
  gatewayTransactionId?: string;

  @ApiProperty({
    example: {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      phoneNumber: '0123456789'
    }
  })
  user: any;

  @ApiProperty({
    example: {
      id: 1,
      appointmentTime: '2023-12-20T10:00:00Z',
      status: 'PENDING',
      service: {
        name: 'Tư vấn và điều trị HIV'
      }
    },
    required: false
  })
  appointment?: any;

  @ApiProperty({
    example: {
      id: 1,
      startDate: '2023-12-20T00:00:00Z',
      endDate: '2024-01-20T00:00:00Z',
      status: false
    },
    required: false
  })
  patientTreatment?: any;

  @ApiProperty({
    example: [
      {
        id: 1,
        type: 'APPOINTMENT_FEE',
        name: 'Phí tư vấn khám bệnh HIV',
        quantity: 1,
        unitPrice: 200000,
        totalPrice: 200000
      }
    ]
  })
  orderDetails: any[];
}

export class WebhookPayloadSwaggerDto {
  @ApiProperty({ example: 'Techcombank' })
  gateway: string;

  @ApiProperty({ example: '2023-12-20 11:30:00' })
  transactionDate: string;

  @ApiProperty({ example: '3991190703' })
  accountNumber: string;

  @ApiProperty({ example: 'in' })
  transferType: string;

  @ApiProperty({ example: 1150000 })
  transferAmount: number;

  @ApiProperty({ example: 'PAY1703123456789ABC' })
  content: string;

  @ApiProperty({ example: 'PAY1703123456789ABC' })
  code: string;

  @ApiProperty({ example: 5000000 })
  accumulated: number;

  @ApiProperty({ example: 'Tin nhắn SMS từ ngân hàng' })
  description: string;
}

export class WebhookResponseSwaggerDto {
  @ApiProperty({ example: 'Payment processed successfully' })
  message: string;

  @ApiProperty({ example: 'SUCCESS' })
  status: string;

  @ApiProperty({
    example: {
      paymentId: 1,
      orderId: 1,
      amount: 1150000,
      status: 'SUCCESS'
    }
  })
  data: any;
}

export class QueueStatusSwaggerDto {
  @ApiProperty({ example: 5 })
  waiting: number;

  @ApiProperty({ example: 2 })
  active: number;

  @ApiProperty({ example: 10 })
  completed: number;

  @ApiProperty({ example: 1 })
  failed: number;
}

export class QueueJobsResponseSwaggerDto {
  @ApiProperty({
    example: [
      {
        id: '1',
        data: { orderId: 123 },
        timestamp: 1703123456789,
        processedOn: null,
        finishedOn: null
      }
    ]
  })
  waiting: any[];

  @ApiProperty({
    example: [
      {
        id: '2',
        data: { orderId: 124 },
        timestamp: 1703123456789,
        processedOn: 1703123456790,
        finishedOn: null
      }
    ]
  })
  active: any[];

  @ApiProperty({
    example: [
      {
        id: '3',
        data: { orderId: 125 },
        timestamp: 1703123456789,
        processedOn: 1703123456790,
        finishedOn: 1703123456800
      }
    ]
  })
  completed: any[];

  @ApiProperty({
    example: [
      {
        id: '4',
        data: { orderId: 126 },
        timestamp: 1703123456789,
        processedOn: 1703123456790,
        finishedOn: 1703123456800,
        failedReason: 'Order not found'
      }
    ]
  })
  failed: any[];
}

export class CancelOrderResponseSwaggerDto {
  @ApiProperty({ example: 'Order cancelled successfully' })
  message: string;

  @ApiProperty({ example: 'CANCELLED' })
  status: string;
}

export class ClearQueueResponseSwaggerDto {
  @ApiProperty({ example: 'Queue cleared successfully' })
  message: string;
}

// Swagger decorators for controller
export const PaymentSwaggerDecorators = {
  // Create Order
  createOrder: {
    operation: ApiOperation({ 
      summary: 'Create a new order',
      description: 'Create a new order with items and payment method. For online payments, a payment URL will be returned for redirecting to payment gateway.'
    }),
    body: ApiBody({ 
      type: CreateOrderSwaggerDto,
      description: 'Order creation data'
    }),
    responses: [
      ApiResponse({ 
        status: 201, 
        description: 'Order created successfully',
        type: OrderResponseSwaggerDto 
      }),
      ApiResponse({ 
        status: 400, 
        description: 'Bad request - Invalid data or missing required fields' 
      }),
      ApiResponse({ 
        status: 404, 
        description: 'User not found' 
      }),
      ApiResponse({ 
        status: 500, 
        description: 'Internal server error' 
      })
    ]
  },

  // Get Order by ID
  getOrder: {
    operation: ApiOperation({ 
      summary: 'Get order by ID',
      description: 'Retrieve detailed order information including user, appointment, patient treatment, and order details'
    }),
    param: ApiParam({ 
      name: 'id', 
      description: 'Order ID',
      example: 1
    }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Order found',
        type: OrderDetailSwaggerDto 
      }),
      ApiResponse({ 
        status: 404, 
        description: 'Order not found' 
      })
    ]
  },

  // Get Orders by User
  getOrdersByUser: {
    operation: ApiOperation({ 
      summary: 'Get orders by user ID',
      description: 'Retrieve all orders for a specific user, ordered by creation date (newest first)'
    }),
    param: ApiParam({ 
      name: 'userId', 
      description: 'User ID',
      example: 1
    }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'User orders found',
        type: [OrderDetailSwaggerDto]
      })
    ]
  },

  // Cancel Order
  cancelOrder: {
    operation: ApiOperation({ 
      summary: 'Cancel an order',
      description: 'Cancel a pending order and remove it from the auto-expiration queue'
    }),
    param: ApiParam({ 
      name: 'id', 
      description: 'Order ID',
      example: 1
    }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Order cancelled successfully',
        type: CancelOrderResponseSwaggerDto 
      }),
      ApiResponse({ 
        status: 400, 
        description: 'Order cannot be cancelled (already processed or cancelled)' 
      }),
      ApiResponse({ 
        status: 404, 
        description: 'Order not found' 
      })
    ]
  },

  // Handle Webhook
  handleWebhook: {
    operation: ApiOperation({ 
      summary: 'Handle Sepay webhook',
      description: 'Process webhook calls from Sepay payment gateway. This endpoint receives real-time notifications when users complete bank transfers.'
    }),
    body: ApiBody({ 
      type: WebhookPayloadSwaggerDto,
      description: 'Webhook payload from Sepay containing bank transfer details'
    }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Webhook processed successfully',
        type: WebhookResponseSwaggerDto 
      }),
      ApiResponse({ 
        status: 400, 
        description: 'Invalid webhook data or amount mismatch' 
      }),
      ApiResponse({ 
        status: 404, 
        description: 'Payment not found' 
      }),
      ApiResponse({ 
        status: 500, 
        description: 'Internal server error' 
      })
    ]
  },

  // Get Queue Status
  getQueueStatus: {
    operation: ApiOperation({ 
      summary: 'Get queue status',
      description: 'Get current status of order queue including waiting, active, completed, failed, and delayed jobs'
    }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Queue status retrieved',
        type: QueueStatusSwaggerDto 
      })
    ]
  },

  // Get Queue Jobs
  getQueueJobs: {
    operation: ApiOperation({ 
      summary: 'Get detailed queue jobs',
      description: 'Get detailed information about all jobs in the queue including job data, timestamps, and status'
    }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Queue jobs retrieved',
        type: QueueJobsResponseSwaggerDto 
      })
    ]
  },

  // Clear Queue
  clearQueue: {
    operation: ApiOperation({ 
      summary: 'Clear all queue jobs',
      description: 'Remove all jobs from the order queue. Use with caution as this will remove all pending auto-expiration jobs.'
    }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Queue cleared successfully',
        type: ClearQueueResponseSwaggerDto 
      })
    ]
  }
};

// Dashboard Payment DTOs
export class PaymentUserSwaggerDto {
  @ApiProperty({ 
    example: 1,
    description: 'User ID'
  })
  id: number;

  @ApiProperty({ 
    example: 'Nguyễn Văn A',
    description: 'User name'
  })
  name: string;

  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email'
  })
  email: string;

  @ApiProperty({ 
    example: '0123456789',
    required: false,
    description: 'User phone number'
  })
  phoneNumber?: string;
}

export class PaymentServiceSwaggerDto {
  @ApiProperty({ 
    example: 1,
    description: 'Service ID'
  })
  id: number;

  @ApiProperty({ 
    example: 'Tư vấn HIV',
    description: 'Service name'
  })
  name: string;

  @ApiProperty({ 
    example: 200000,
    description: 'Service price in VND'
  })
  price: number;
}

export class PaymentDoctorSwaggerDto {
  @ApiProperty({ 
    example: 1,
    description: 'Doctor ID'
  })
  id: number;

  @ApiProperty({ 
    type: PaymentUserSwaggerDto,
    description: 'Doctor user information'
  })
  user: PaymentUserSwaggerDto;
}

export class PaymentAppointmentSwaggerDto {
  @ApiProperty({ 
    example: 1,
    description: 'Appointment ID'
  })
  id: number;

  @ApiProperty({ 
    example: '2024-01-20T14:00:00Z',
    description: 'Appointment time'
  })
  appointmentTime: string;

  @ApiProperty({ 
    example: 'CONFIRMED',
    description: 'Appointment status'
  })
  status: string;

  @ApiProperty({ 
    type: PaymentServiceSwaggerDto,
    description: 'Service information'
  })
  service: PaymentServiceSwaggerDto;

  @ApiProperty({ 
    type: PaymentDoctorSwaggerDto,
    description: 'Doctor information'
  })
  doctor: PaymentDoctorSwaggerDto;
}

export class PaymentPatientTreatmentSwaggerDto {
  @ApiProperty({ 
    example: 1,
    description: 'Patient treatment ID'
  })
  id: number;

  @ApiProperty({ 
    example: '2024-01-15T00:00:00Z',
    description: 'Treatment start date'
  })
  startDate: string;

  @ApiProperty({ 
    example: '2024-03-15T00:00:00Z',
    required: false,
    description: 'Treatment end date'
  })
  endDate?: string;

  @ApiProperty({ 
    example: true,
    description: 'Treatment status'
  })
  status: boolean;
}

export class PaymentOrderDetailSwaggerDto {
  @ApiProperty({ 
    example: 1,
    description: 'Order detail ID'
  })
  id: number;

  @ApiProperty({ 
    example: 'APPOINTMENT_FEE',
    enum: ['APPOINTMENT_FEE', 'MEDICINE', 'TEST', 'CONSULTATION', 'TREATMENT'],
    description: 'Order item type'
  })
  type: string;

  @ApiProperty({ 
    example: 1,
    required: false,
    description: 'Reference ID'
  })
  referenceId?: number;

  @ApiProperty({ 
    example: 'Phí tư vấn khám bệnh HIV',
    description: 'Item name'
  })
  name: string;

  @ApiProperty({ 
    example: 1,
    description: 'Quantity'
  })
  quantity: number;

  @ApiProperty({ 
    example: 200000,
    description: 'Unit price in VND'
  })
  unitPrice: number;

  @ApiProperty({ 
    example: 200000,
    description: 'Total price in VND'
  })
  totalPrice: number;
}

export class PaymentOrderSwaggerDto {
  @ApiProperty({ 
    example: 1,
    description: 'Order ID'
  })
  id: number;

  @ApiProperty({ 
    example: 'PAID',
    enum: ['PENDING', 'PAID', 'CANCELLED'],
    description: 'Order status'
  })
  orderStatus: string;

  @ApiProperty({ 
    type: PaymentUserSwaggerDto,
    description: 'Customer information'
  })
  user: PaymentUserSwaggerDto;

  @ApiProperty({ 
    type: PaymentAppointmentSwaggerDto,
    required: false,
    description: 'Appointment information'
  })
  appointment?: PaymentAppointmentSwaggerDto;

  @ApiProperty({ 
    type: PaymentPatientTreatmentSwaggerDto,
    required: false,
    description: 'Patient treatment information'
  })
  patientTreatment?: PaymentPatientTreatmentSwaggerDto;

  @ApiProperty({ 
    type: [PaymentOrderDetailSwaggerDto],
    description: 'Order details'
  })
  orderDetails: PaymentOrderDetailSwaggerDto[];
}

export class DashboardPaymentSwaggerDto {
  @ApiProperty({ 
    example: 1,
    description: 'Payment ID'
  })
  id: number;

  @ApiProperty({ 
    example: 500000,
    description: 'Payment amount in VND'
  })
  amount: number;

  @ApiProperty({ 
    example: 'SUCCESS',
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    description: 'Payment status'
  })
  status: string;

  @ApiProperty({ 
    example: 'BANK_TRANSFER',
    enum: ['BANK_TRANSFER', 'CASH', 'CARD'],
    description: 'Payment method'
  })
  method: string;

  @ApiProperty({ 
    example: 'PAY_123456',
    description: 'Transaction code'
  })
  transactionCode: string;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00Z',
    description: 'Payment creation time'
  })
  createdAt: string;

  @ApiProperty({ 
    example: '2024-01-15T10:35:00Z',
    required: false,
    description: 'Payment completion time'
  })
  paidAt?: string;

  @ApiProperty({ 
    type: PaymentOrderSwaggerDto,
    description: 'Order information'
  })
  order: PaymentOrderSwaggerDto;
}

export class PaginationSwaggerDto {
  @ApiProperty({ 
    example: 150,
    description: 'Total number of items'
  })
  total: number;

  @ApiProperty({ 
    example: 1,
    description: 'Current page number'
  })
  page: number;

  @ApiProperty({ 
    example: 20,
    description: 'Number of items per page'
  })
  limit: number;

  @ApiProperty({ 
    example: 8,
    description: 'Total number of pages'
  })
  totalPages: number;
}

export class PaymentSummarySwaggerDto {
  @ApiProperty({ 
    example: 45000000,
    description: 'Total revenue in VND'
  })
  totalRevenue: number;

  @ApiProperty({ 
    example: 120,
    description: 'Number of successful payments'
  })
  successfulPayments: number;

  @ApiProperty({ 
    example: 25,
    description: 'Number of pending payments'
  })
  pendingPayments: number;

  @ApiProperty({ 
    example: 5,
    description: 'Number of failed payments'
  })
  failedPayments: number;

  @ApiProperty({ 
    example: 150,
    description: 'Total number of payments'
  })
  totalPayments: number;
}

export class DashboardPaymentsResponseSwaggerDto {
  @ApiProperty({ 
    type: [DashboardPaymentSwaggerDto],
    description: 'List of payments'
  })
  payments: DashboardPaymentSwaggerDto[];

  @ApiProperty({ 
    type: PaginationSwaggerDto,
    description: 'Pagination information'
  })
  pagination: PaginationSwaggerDto;

  @ApiProperty({ 
    type: PaymentSummarySwaggerDto,
    description: 'Payment summary statistics'
  })
  summary: PaymentSummarySwaggerDto;
}

export class RevenueStatSwaggerDto {
  @ApiProperty({ 
    example: '2024-01',
    description: 'Time period (format depends on period type)'
  })
  period: string;

  @ApiProperty({ 
    example: 12500000,
    description: 'Revenue for this period in VND'
  })
  revenue: number;

  @ApiProperty({ 
    example: 45,
    description: 'Number of payments in this period'
  })
  paymentCount: number;

  @ApiProperty({ 
    example: 45,
    description: 'Number of successful payments in this period'
  })
  successfulPayments: number;
}

export class RevenueSummarySwaggerDto {
  @ApiProperty({ 
    example: 46450000,
    description: 'Total revenue in VND'
  })
  totalRevenue: number;

  @ApiProperty({ 
    example: 160,
    description: 'Total number of payments'
  })
  totalPayments: number;

  @ApiProperty({ 
    example: 290312.5,
    description: 'Average revenue per payment'
  })
  averageRevenue: number;
}

export class RevenueStatsResponseSwaggerDto {
  @ApiProperty({ 
    type: [RevenueStatSwaggerDto],
    description: 'Revenue statistics by time period'
  })
  stats: RevenueStatSwaggerDto[];

  @ApiProperty({ 
    type: RevenueSummarySwaggerDto,
    description: 'Overall revenue summary'
  })
  summary: RevenueSummarySwaggerDto;
}

// Tags for Swagger
export const PaymentSwaggerTags = ApiTags('Orders & Payments'); 