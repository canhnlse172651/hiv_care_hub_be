import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ReminderType } from '@prisma/client'

@Injectable()
export class ReminderService {
  constructor(private readonly prisma: PrismaService) {}

  async createAppointmentReminder(params: {
    userId: number
    appointmentId: number
    appointmentTime: Date
    message?: string
    remindBeforeMinutes?: number // default: 60
  }) {
    const remindAt = new Date(params.appointmentTime.getTime() - 1000 * 60 * (params.remindBeforeMinutes || 60))
    // Kiểm tra tránh tạo reminder trùng
    const existed = await this.prisma.reminder.findFirst({
      where: {
        userId: params.userId,
        type: 'APPOINTMENT',
        remindAt,
        message: params.message,
      },
    })
    if (existed) return existed
    return this.prisma.reminder.create({
      data: {
        userId: params.userId,
        type: ReminderType.APPOINTMENT,
        message: params.message || 'Bạn có lịch hẹn sắp tới!',
        remindAt,
        isSent: false,
      },
    })
  }

  async markAsSent(reminderId: number) {
    return this.prisma.reminder.update({ where: { id: reminderId }, data: { isSent: true } })
  }

  async getPendingReminders(now: Date = new Date()) {
    return this.prisma.reminder.findMany({
      where: {
        isSent: false,
        remindAt: { lte: now },
      },
    })
  }
}
