import { Injectable } from '@nestjs/common'
import { AppointmentHistory } from './appointment-history.model'
import { AppointmentHistoryRepository } from './appointment-history.repository'

@Injectable()
export class AppointmentHistoryService {
  constructor(private readonly repo: AppointmentHistoryRepository) {}

  async logStatusChange(params: {
    appointmentId: number
    oldStatus: string
    newStatus: string
    changedBy?: number
    note?: string
  }) {
    return this.repo.createHistory({
      appointmentId: params.appointmentId,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      changedBy: params.changedBy,
      note: params.note,
      changedAt: new Date(),
    })
  }

  async getHistory(appointmentId: number) {
    return this.repo.getHistoryByAppointment(appointmentId)
  }
}
