import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { PaymentQueueService } from './payment-queue.service';
import { PaymentGatewayService } from './payment-gateway.service';

export interface CreatePaymentDto {
  userId: number;
  appointmentId?: number;
  patientTreatmentId?: number;
  items: {
    type: string; // PaymentItemType
    referenceId?: number;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  method: string; // PaymentMethod
}

export interface PaymentResponse {
  id: number;
  transactionCode: string;
  amount: number;
  status: string; // PaymentStatus
  paymentUrl?: string;
  gatewayTransactionId?: string;
}

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private paymentQueueService: PaymentQueueService,
    private paymentGatewayService: PaymentGatewayService,
  ) {}

  async createPayment(dto: CreatePaymentDto): Promise<PaymentResponse> {
    const { userId, appointmentId, patientTreatmentId, items, method } = dto;

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    // Generate transaction code
    const transactionCode = this.generateTransactionCode();

    // Create payment transaction
    const paymentTransaction = await this.prisma.paymentTransaction.create({
      data: {
        userId,
        appointmentId,
        patientTreatmentId,
        amount: totalAmount,
        method: method as any, // PaymentMethod
        status: 'PENDING', // PaymentStatus.PENDING
        transactionCode,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Create payment items
    const paymentItems = await Promise.all(
      items.map((item) =>
        this.prisma.paymentItem.create({
          data: {
            paymentTransactionId: paymentTransaction.id,
            type: item.type as any, // PaymentItemType
            referenceId: item.referenceId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          },
        }),
      ),
    );

    // Add to queue for auto-cancel after 24h (COMMENTED FOR TESTING)
    await this.paymentQueueService.addCancelPaymentJob(paymentTransaction.id);

    // If online payment, get payment URL
    let paymentUrl: string | undefined;
    let gatewayTransactionId: string | undefined;

    if (method !== 'CASH') { // PaymentMethod.CASH
      const gatewayResponse = await this.paymentGatewayService.createPayment({
        amount: totalAmount,
        transactionCode,
        description: `Payment for ${items.map(item => item.name).join(', ')}`,
        returnUrl: `${process.env.FRONTEND_URL}/payment/callback`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
      });

      paymentUrl = gatewayResponse.paymentUrl;
      gatewayTransactionId = gatewayResponse.gatewayTransactionId;

      // Update payment transaction with gateway info
      await this.prisma.paymentTransaction.update({
        where: { id: paymentTransaction.id },
        data: {
          gatewayTransactionId,
          gatewayResponse: gatewayResponse as any,
        },
      });
    }

    return {
      id: paymentTransaction.id,
      transactionCode,
      amount: totalAmount,
      status: paymentTransaction.status,
      paymentUrl,
      gatewayTransactionId,
    };
  }

  async getPaymentById(id: number) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentTime: true,
            status: true,
          },
        },
        patientTreatment: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
        items: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentsByUserId(userId: number) {
    return this.prisma.paymentTransaction.findMany({
      where: { userId },
      include: {
        items: true,
        appointment: {
          select: {
            id: true,
            appointmentTime: true,
            status: true,
          },
        },
        patientTreatment: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelPayment(id: number): Promise<void> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PENDING') { // PaymentStatus.PENDING
      throw new BadRequestException('Payment cannot be cancelled');
    }

    await this.prisma.paymentTransaction.update({
      where: { id },
      data: {
        status: 'CANCELLED', // PaymentStatus.CANCELLED
      },
    });

    // Remove cancel job from queue (COMMENTED FOR TESTING)
    await this.paymentQueueService.removeCancelPaymentJob(id);
  }

  async confirmPayment(transactionCode: string, gatewayData: any): Promise<void> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { transactionCode },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PENDING') { // PaymentStatus.PENDING
      throw new BadRequestException('Payment is not pending');
    }

    // Verify payment with gateway
    if (!payment.gatewayTransactionId) {
      throw new BadRequestException('Payment has no gateway transaction ID');
    }
    
    const isVerified = await this.paymentGatewayService.verifyPayment(
      payment.gatewayTransactionId,
      gatewayData,
    );

    if (!isVerified) {
      throw new BadRequestException('Payment verification failed');
    }

    // Update payment status
    await this.prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS', // PaymentStatus.SUCCESS
        paidAt: new Date(),
        gatewayResponse: gatewayData,
      },
    });

    // Update related appointment or treatment status
    if (payment.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: 'PAID' },
      });
    }

    // Remove cancel job from queue (COMMENTED FOR TESTING)
    await this.paymentQueueService.removeCancelPaymentJob(payment.id);
  }

  private generateTransactionCode(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `PAY${timestamp}${random}`.toUpperCase();
  }
} 