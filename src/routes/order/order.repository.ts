import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { CreateOrderType, UpdateOrderType } from './order.model';

@Injectable()
export class OrderRepository {
  private readonly logger = new Logger(OrderRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderType) {
    this.logger.log(`🗄️ [ORDER_REPO] Starting order creation in database`);
    this.logger.log(`📊 [ORDER_REPO] Order data: UserID=${data.userId}, Method=${data.method}, Items=${data.items.length}`);
    
    const { items, method, ...orderData } = data;
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    this.logger.log(`💰 [ORDER_REPO] Calculated total amount: ${totalAmount}`);

    // Generate order code
    const orderCode = this.generateOrderCode();
    this.logger.log(`🏷️ [ORDER_REPO] Generated order code: ${orderCode}`);

    // Generate transaction code
    const transactionCode = this.generateTransactionCode();
    this.logger.log(`💳 [ORDER_REPO] Generated transaction code: ${transactionCode}`);

    try {
      // Create order with details
      const result = await this.prisma.order.create({
        data: {
          ...orderData,
          orderCode,
          totalAmount,
          orderStatus: OrderStatus.PENDING,
          orderDetails: {
            create: items.map(item => ({
              type: item.type,
              referenceId: item.referenceId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
          payments: {
            create: {
              amount: totalAmount,
              method: method, // method belongs to Payment, not Order
              status: PaymentStatus.PENDING,
              transactionCode: transactionCode,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          appointment: {
            include: {
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
          patientTreatment: true,
          orderDetails: true,
          payments: true,
        },
      });
      
      this.logger.log(`✅ [ORDER_REPO] Order created successfully: OrderID=${result.id}, OrderCode=${result.orderCode}`);
      this.logger.log(`💳 [ORDER_REPO] Payment created: PaymentID=${result.payments[0]?.id}, Status=${result.payments[0]?.status}`);
      this.logger.log(`📦 [ORDER_REPO] Order details created: ${result.orderDetails.length} items`);
      
      return result;
    } catch (error) {
      this.logger.error(`❌ [ORDER_REPO] Error creating order: ${error.message}`);
      this.logger.error(`📊 [ORDER_REPO] Error details: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }

  async findById(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointment: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        patientTreatment: true,
        orderDetails: true,
        payments: true,
      },
    });
  }

  async findByUserId(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointment: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        patientTreatment: true,
        orderDetails: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrderCode(orderCode: string) {
    return this.prisma.order.findUnique({
      where: { orderCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointment: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        patientTreatment: true,
        orderDetails: true,
        payments: true,
      },
    });
  }

  async update(id: number, data: UpdateOrderType) {
    return this.prisma.order.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointment: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        patientTreatment: true,
        orderDetails: true,
        payments: true,
      },
    });
  }

  async updateExpiredAt(id: number, expiredAt: Date) {
    return this.prisma.order.update({
      where: { id },
      data: { expiredAt },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointment: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        patientTreatment: true,
        orderDetails: true,
        payments: true,
      },
    });
  }

  async updateStatus(id: number, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { orderStatus: status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointment: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        patientTreatment: true,
        orderDetails: true,
        payments: true,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.order.delete({
      where: { id },
    });
  }

  async findPendingOrders() {
    return this.prisma.order.findMany({
      where: { 
        orderStatus: OrderStatus.PENDING,
        expiredAt: {
          lt: new Date(),
        },
      },
      include: {
        payments: true,
      },
    });
  }

  private generateOrderCode(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DH${timestamp}${random}`;
  }

  private generateTransactionCode(): string {
    // Generate Sepay-compatible transaction code for QR code content
    // Format: PREFIX + SUFFIX (số nguyên)
    // - Prefix: 2-5 ký tự (mặc định: DH)
    // - Suffix: 3-10 ký tự số nguyên
    // Example: DH12345, DH678901234
    
    const prefix = 'DH'; // 2 ký tự
    const suffix = Math.floor(Math.random() * 900000000) + 100000000; // 9 digits (3-10 chars)
    
    return `${prefix}${suffix}`;
  }
} 