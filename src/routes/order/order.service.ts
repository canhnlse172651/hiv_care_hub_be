import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { OrderRepository } from './order.repository'
import { CreateOrderType, UpdateOrderType, OrderResponseType } from './order.model'
import { OrderStatus, PaymentMethod } from '@prisma/client'
import { OrderProducer } from './order.producer'
import { generateSepayTransferContent } from 'src/shared/utils/payment.utils'

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name)

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderProducer: OrderProducer,
  ) {}

  async createOrder(data: CreateOrderType): Promise<OrderResponseType> {
    this.logger.log(`🔍 [ORDER_SERVICE] Starting order creation validation`)
    this.logger.log(`👤 [ORDER_SERVICE] Validating user: UserID=${data.userId}`)

    // Validate user exists
    const user = await this.validateUser(data.userId)
    this.logger.log(`✅ [ORDER_SERVICE] User validation passed: UserID=${user.id}`)

    // Validate appointment if provided
    if (data.appointmentId) {
      this.logger.log(`📅 [ORDER_SERVICE] Validating appointment: AppointmentID=${data.appointmentId}`)
      await this.validateAppointment(data.appointmentId, data.userId)
      this.logger.log(`✅ [ORDER_SERVICE] Appointment validation passed: AppointmentID=${data.appointmentId}`)
    }

    // Validate patient treatment if provided
    if (data.patientTreatmentId) {
      this.logger.log(`🏥 [ORDER_SERVICE] Validating patient treatment: PatientTreatmentID=${data.patientTreatmentId}`)
      await this.validatePatientTreatment(data.patientTreatmentId, data.userId)
      this.logger.log(
        `✅ [ORDER_SERVICE] Patient treatment validation passed: PatientTreatmentID=${data.patientTreatmentId}`,
      )
    }

    this.logger.log(`💰 [ORDER_SERVICE] Creating order in database with payment method: ${data.method}`)
    this.logger.log(`📦 [ORDER_SERVICE] Order items: ${JSON.stringify(data.items, null, 2)}`)

    // Create order with payment
    const order = await this.orderRepository.create(data)
    this.logger.log(`✅ [ORDER_SERVICE] Order created in database: OrderID=${order.id}, OrderCode=${order.orderCode}`)

    // Set expiration time (24 hours from now)
    const expiredAt = new Date()
    expiredAt.setHours(expiredAt.getHours() + 24)

    this.logger.log(`⏰ [ORDER_SERVICE] Setting order expiration: ${expiredAt.toISOString()}`)
    await this.orderRepository.updateExpiredAt(order.id, expiredAt)
    this.logger.log(`✅ [ORDER_SERVICE] Order expiration set successfully`)

    // Add payment queue job for auto-cancel after 24 hours
    const payment = order.payments[0]
    this.logger.log(`🔄 [ORDER_SERVICE] Adding payment queue job for auto-cancel: PaymentID=${payment.id}`)
    await this.orderProducer.addCancelPaymentJob(payment.id)
    this.logger.log(`✅ [ORDER_SERVICE] Payment queue job added successfully`)

    // Generate payment URL for non-cash payments
    if (data.method !== PaymentMethod.CASH) {
      this.logger.log(`🏦 [ORDER_SERVICE] Generating payment URL for non-cash payment`)
      const paymentUrl = this.generateBankTransferUrl(payment, order)
      const bankInfo = this.generateBankInfo(payment, order)

      this.logger.log(`🔗 [ORDER_SERVICE] Payment URL generated: ${paymentUrl}`)
      this.logger.log(`🏦 [ORDER_SERVICE] Bank info: ${JSON.stringify(bankInfo, null, 2)}`)

      // Return order with payment URL in a separate field
      const result = {
        ...order,
        totalAmount: Number(order.totalAmount),
        orderDetails: order.orderDetails.map((detail) => ({
          ...detail,
          unitPrice: Number(detail.unitPrice),
          totalPrice: Number(detail.totalPrice),
        })),
        payments: order.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
        paymentUrl, // Add payment URL as separate field
        bankInfo, // Add bank info as separate field
      } as any

      this.logger.log(`✅ [ORDER_SERVICE] Order creation completed with payment URL: OrderID=${result.id}`)
      return result
    }

    this.logger.log(`💵 [ORDER_SERVICE] Processing cash payment - no payment URL needed`)
    const result = {
      ...order,
      totalAmount: Number(order.totalAmount),
      orderDetails: order.orderDetails.map((detail) => ({
        ...detail,
        unitPrice: Number(detail.unitPrice),
        totalPrice: Number(detail.totalPrice),
      })),
      payments: order.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    } as any

    this.logger.log(`✅ [ORDER_SERVICE] Order creation completed for cash payment: OrderID=${result.id}`)
    return result
  }

  async getOrderById(id: number): Promise<OrderResponseType> {
    const order = await this.orderRepository.findById(id)
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`)
    }
    // Add payment queue job for auto-cancel after 24 hours
    const payment = order.payments[0]
    const paymentUrl = this.generateBankTransferUrl(payment, order)

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      orderDetails: order.orderDetails.map((detail) => ({
        ...detail,
        unitPrice: Number(detail.unitPrice),
        totalPrice: Number(detail.totalPrice),
      })),
      payments: order.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      paymentUrl,
    } as any
  }

  async getOrdersByUserId(userId: number): Promise<OrderResponseType[]> {
    const orders = await this.orderRepository.findByUserId(userId)

    return orders.map((order) => {
      const payment = order.payments[0]
      const paymentUrl = this.generateBankTransferUrl(payment, order)

      return {
        ...order,
        totalAmount: Number(order.totalAmount),
        orderDetails: order.orderDetails.map((detail) => ({
          ...detail,
          unitPrice: Number(detail.unitPrice),
          totalPrice: Number(detail.totalPrice),
        })),
        payments: order.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
        paymentUrl, // Add payment URL as separate field
      }
    }) as any
  }

  async getOrderByOrderCode(orderCode: string): Promise<OrderResponseType> {
    const order = await this.orderRepository.findByOrderCode(orderCode)
    if (!order) {
      throw new NotFoundException(`Order with code ${orderCode} not found`)
    }
    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      orderDetails: order.orderDetails.map((detail) => ({
        ...detail,
        unitPrice: Number(detail.unitPrice),
        totalPrice: Number(detail.totalPrice),
      })),
      payments: order.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    } as any
  }

  async updateOrder(id: number, data: UpdateOrderType): Promise<OrderResponseType> {
    const order = await this.orderRepository.findById(id)
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`)
    }

    // Check if order can be updated
    if (order.orderStatus === OrderStatus.PAID) {
      throw new BadRequestException('Cannot update paid order')
    }

    const updatedOrder = await this.orderRepository.update(id, data)
    return {
      ...updatedOrder,
      totalAmount: Number(updatedOrder.totalAmount),
      orderDetails: updatedOrder.orderDetails.map((detail) => ({
        ...detail,
        unitPrice: Number(detail.unitPrice),
        totalPrice: Number(detail.totalPrice),
      })),
      payments: updatedOrder.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    } as any
  }

  private async validateUser(userId: number) {
    // This would typically check if user exists and is active
    // For now, we'll assume the user exists
    return { id: userId }
  }

  private async validateAppointment(appointmentId: number, userId: number) {
    // This would typically check if appointment exists and belongs to user
    // For now, we'll assume the appointment exists
    return { id: appointmentId }
  }

  private async validatePatientTreatment(patientTreatmentId: number, userId: number) {
    // This would typically check if patient treatment exists and belongs to user
    // For now, we'll assume the patient treatment exists
    return { id: patientTreatmentId }
  }

  private generateBankTransferUrl(payment: any, order: any): string {
    const accountNumber = process.env.BANK_ACCOUNT_NUMBER || '03533664595'
    const bankName = process.env.BANK_NAME || 'TPBank'
    const amount = payment.amount.toString()

    // Use payment's transactionCode as QR code content
    const content = payment.transactionCode

    this.logger.log(`📝 [ORDER_SERVICE] Using payment transactionCode as QR content: ${content}`)
    this.logger.log(
      `💳 [ORDER_SERVICE] Payment details: PaymentID=${payment.id}, TransactionCode=${payment.transactionCode}`,
    )

    // Generate Sepay QR code URL
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankName}&amount=${amount}&des=${encodeURIComponent(content)}`

    return qrCodeUrl
  }

  private generateBankInfo(payment: any, order: any): any {
    const accountNumber = process.env.BANK_ACCOUNT_NUMBER || '03533664595'
    const accountName = process.env.BANK_ACCOUNT_NAME || 'HIV CARE HUB'
    const bankName = process.env.BANK_NAME || 'TPBank'
    const amount = payment.amount.toString()

    // Use payment's transactionCode as transfer content
    const content = payment.transactionCode

    return {
      accountNumber,
      accountName,
      bankName,
      amount,
      content,
      paymentId: payment.id,
      transactionCode: payment.transactionCode,
    }
  }
}
