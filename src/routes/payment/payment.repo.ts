import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { parse } from 'date-fns'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AppoinmentService } from '../appoinment/appoinment.service'

@Injectable()
export class PaymentRepo {
  private readonly logger = new Logger(PaymentRepo.name)

  constructor(
    private readonly prismaService: PrismaService,
    private readonly appointmentService: AppoinmentService,
  ) {}

  async receiver(body: WebhookPaymentBodyType): Promise<any> {
    this.logger.log(`📥 Processing Sepay webhook: ${JSON.stringify(body, null, 2)}`)

    try {
      // 1. Lưu thông tin giao dịch vào PaymentTransaction (audit log)
      let amountIn = 0
      let amountOut = 0
      if (body.transferType === 'in') {
        amountIn = body.transferAmount
      } else if (body.transferType === 'out') {
        amountOut = body.transferAmount
      }

      await this.prismaService.paymentTransaction.create({
        data: {
          gateway: body.gateway,
          transactionDate: parse(body.transactionDate, 'yyyy-MM-dd HH:mm:ss', new Date()),
          accountNumber: body.accountNumber,
          subAccount: body.subAccount,
          amountIn,
          amountOut,
          accumulated: body.accumulated,
          code: body.code,
          transactionContent: body.content,
          referenceNumber: body.referenceCode,
          body: body.description,
        },
      })

      // 2. Tìm Payment theo transactionCode từ webhook
      this.logger.log(`🔍 [PAYMENT_REPO] Looking for payment with transactionCode: ${body.code}`)

      if (!body.code) {
        this.logger.error(`❌ [PAYMENT_REPO] No transaction code provided in webhook`)
        throw new BadRequestException('No transaction code provided in webhook')
      }

      const payment = await this.prismaService.payment.findUnique({
        where: {
          transactionCode: body.code,
        },
        include: {
          order: {
            include: {
              orderDetails: true,
              appointment: true,
              patientTreatment: true,
            },
          },
        },
      })

      if (!payment) {
        this.logger.error(`❌ [PAYMENT_REPO] Payment not found with transactionCode: ${body.code}`)
        throw new BadRequestException(`Payment not found with transactionCode ${body.code}`)
      }

      this.logger.log(`✅ [PAYMENT_REPO] Found payment: PaymentID=${payment.id}, OrderID=${payment.orderId}`)

      // 3. Kiểm tra amount có khớp không
      const expectedAmount = Number(payment.amount)
      const receivedAmount = body.transferAmount

      this.logger.log(`💰 [PAYMENT_REPO] Amount check: Expected=${expectedAmount}, Received=${receivedAmount}`)

      if (expectedAmount !== receivedAmount) {
        this.logger.error(`❌ [PAYMENT_REPO] Amount mismatch: expected ${expectedAmount} but got ${receivedAmount}`)
        throw new BadRequestException(`Amount mismatch: expected ${expectedAmount} but got ${receivedAmount}`)
      }

      // 4. Cập nhật trạng thái Payment và Order
      await this.prismaService.$transaction(async (tx) => {
        // Cập nhật Payment status
        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
            gatewayResponse: body,
          },
        })

        // Cập nhật Order status
        await tx.order.update({
          where: {
            id: payment.orderId,
          },
          data: {
            orderStatus: OrderStatus.PAID,
          },
        })

        // Cập nhật trạng thái Appointment nếu có
        const appointmentId = payment.order.appointmentId
        if (appointmentId) {
          // Kiểm tra nếu đã có PatientTreatment liên kết appointment này chưa
          const existedTreatment = await tx.patientTreatment.findFirst({
            where: {
              orders: {
                some: {
                  appointmentId: appointmentId,
                },
              },
            },
          })

          if (!existedTreatment) {
            // An toàn: gọi update với flag không tự tạo treatment
            await this.appointmentService.updateAppointmentStatus({
              id: appointmentId,
              status: 'PAID',
              autoEndExisting: false,
            })
          } else {
            this.logger.warn(`⚠️ AppointmentID=${appointmentId} đã có patientTreatment, không cập nhật thêm.`)
          }
        }

        // Cập nhật PatientTreatment status nếu có
        if (payment.order.patientTreatmentId) {
          await tx.patientTreatment.update({
            where: {
              id: payment.order.patientTreatmentId,
            },
            data: {
              status: true,
            },
          })
        }
      })

      this.logger.log(
        `✅ Payment processed successfully: PaymentID=${payment.id}, OrderID=${payment.orderId}, Amount=${receivedAmount}`,
      )

      return {
        message: 'Payment processed successfully',
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          amount: receivedAmount,
          status: 'SUCCESS',
        },
      }
    } catch (error) {
      this.logger.error(`❌ Payment processing failed: ${error.message}`)
      throw error
    }
  }

  async cancelPaymentAndOrder(paymentId: number): Promise<void> {
    this.logger.log(`🔄 Cancelling payment and order: PaymentID=${paymentId}`)

    try {
      const payment = await this.prismaService.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      })

      if (!payment) {
        this.logger.warn(`Payment not found: PaymentID=${paymentId}`)
        return
      }

      await this.prismaService.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
          },
        })

        // Update order status
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            orderStatus: OrderStatus.PENDING,
            notes: 'Order payment expired automatically',
          },
        })
      })

      this.logger.log(`✅ Payment and order cancelled successfully: PaymentID=${paymentId}, OrderID=${payment.orderId}`)
    } catch (error) {
      this.logger.error(`❌ Failed to cancel payment and order: ${error.message}`)
      throw error
    }
  }

  async getPaymentById(id: number) {
    return this.prismaService.payment.findUnique({
      where: { id },
      include: {
        order: {
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
              select: {
                id: true,
                appointmentTime: true,
                status: true,
                doctor: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            patientTreatment: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
                status: true,
              },
            },
            orderDetails: true,
          },
        },
      },
    })
  }

  async getPaymentsByUserId(userId: number) {
    return this.prismaService.payment.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        order: {
          include: {
            orderDetails: true,
            appointment: {
              select: {
                id: true,
                appointmentTime: true,
                status: true,
                service: {
                  select: {
                    name: true,
                  },
                },
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
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getPaymentByTransactionCode(transactionCode: string) {
    return this.prismaService.payment.findUnique({
      where: { transactionCode },
      include: {
        order: {
          include: {
            orderDetails: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })
  }
}
