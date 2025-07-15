import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AppointmentHistory } from './appointment-history.model'

@Injectable()
export class AppointmentHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createHistory(data: Omit<AppointmentHistory, 'id'>) {
    return await this.prisma.appointmentHistory.create({ data })
  }

  async getHistoryByAppointment(appointmentId: number) {
    return await this.prisma.appointmentHistory.findMany({
      where: { appointmentId },
      orderBy: { changedAt: 'desc' },
    })
  }
}
