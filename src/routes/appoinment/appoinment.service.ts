import { BadRequestException, Injectable } from '@nestjs/common'
import { AppoinmentRepository } from '../../repositories/appoinment.repository'
import { AppointmentResponseType, CreateAppointmentDtoType, UpdateAppointmentDtoType } from './appoinment.dto'
import { PaginatedResponse, PaginationOptions } from 'src/shared/schemas/pagination.schema'
import { AppointmentStatus } from '@prisma/client'
import { AuthRepository } from 'src/repositories/user.repository'
import { ServiceRepository } from 'src/repositories/service.repository'
import { PaginationService } from 'src/shared/services/pagination.service'

@Injectable()
export class AppoinmentService {
  constructor(
    private readonly appoinmentRepository: AppoinmentRepository,
    private readonly userRepository: AuthRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createAppointment(data: CreateAppointmentDtoType): Promise<AppointmentResponseType> {
    const user = await this.userRepository.findUserById(data.userId)
    if (!user) throw new BadRequestException('User not found')

    const doctor = await this.userRepository.findUserById(data.doctorId)
    if (!doctor) throw new BadRequestException('Doctor not found')

    if (data.appointmentTime < new Date()) throw new BadRequestException('Appointment time cannot be in the past')

    const service = await this.serviceRepository.findServiceById(data.serviceId)
    if (!service) throw new BadRequestException('Service not found')

    const appointmentDate = new Date(data.appointmentTime)
    const serviceStart = new Date(service.startTime)
    const serviceEnd = new Date(service.endTime)

    // Lấy giờ, phút, giây
    const [aH, aM, aS] = [appointmentDate.getHours(), appointmentDate.getMinutes(), appointmentDate.getSeconds()]
    const [sH, sM, sS] = [serviceStart.getHours(), serviceStart.getMinutes(), serviceStart.getSeconds()]
    const [eH, eM, eS] = [serviceEnd.getHours(), serviceEnd.getMinutes(), serviceEnd.getSeconds()]

    // So sánh >= start
    const isAfterStart = aH > sH || (aH === sH && aM > sM) || (aH === sH && aM === sM && aS >= sS)

    // So sánh <= end
    const isBeforeEnd = aH < eH || (aH === eH && aM < eM) || (aH === eH && aM === eM && aS <= eS)

    if (!isAfterStart || !isBeforeEnd) {
      throw new BadRequestException('Appointment time must be within service working hours')
    }

    return await this.appoinmentRepository.createAppointment(data)
  }

  async updateAppointment(id: number, data: UpdateAppointmentDtoType): Promise<AppointmentResponseType> {
    const existed = await this.appoinmentRepository.findAppointmentById(id)
    if (!existed) throw new BadRequestException('Appointment not found')

    if (data.userId) {
      const user = await this.userRepository.findUserById(data.userId)
      if (!user) throw new BadRequestException('User not found')
    }

    if (data.doctorId) {
      const doctor = await this.userRepository.findUserById(data.doctorId)
      if (!doctor) throw new BadRequestException('Doctor not found')
    }

    if (data.appointmentTime && data.appointmentTime < new Date())
      throw new BadRequestException('Appointment time cannot be in the past')

    if (data.serviceId && data.appointmentTime) {
      const service = await this.serviceRepository.findServiceById(data.serviceId)
      if (!service) throw new BadRequestException('Service not found')

      const appointmentDate = new Date(data.appointmentTime)
      const serviceStart = new Date(service.startTime)
      const serviceEnd = new Date(service.endTime)

      // Lấy giờ, phút, giây
      const [aH, aM, aS] = [appointmentDate.getHours(), appointmentDate.getMinutes(), appointmentDate.getSeconds()]
      const [sH, sM, sS] = [serviceStart.getHours(), serviceStart.getMinutes(), serviceStart.getSeconds()]
      const [eH, eM, eS] = [serviceEnd.getHours(), serviceEnd.getMinutes(), serviceEnd.getSeconds()]

      // So sánh >= start
      const isAfterStart = aH > sH || (aH === sH && aM > sM) || (aH === sH && aM === sM && aS >= sS)

      // So sánh <= end
      const isBeforeEnd = aH < eH || (aH === eH && aM < eM) || (aH === eH && aM === eM && aS <= eS)

      if (!isAfterStart || !isBeforeEnd) {
        throw new BadRequestException('Appointment time must be within service working hours')
      }
    }
    return this.appoinmentRepository.updateAppointment(id, data)
  }

  async updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<AppointmentResponseType> {
    const existed = await this.appoinmentRepository.findAppointmentById(id)
    if (!existed) throw new BadRequestException('Appointment not found')
    return this.appoinmentRepository.updateAppointmentStatus(id, status)
  }

  async deleteAppointment(id: number): Promise<AppointmentResponseType> {
    const existed = await this.appoinmentRepository.findAppointmentById(id)
    if (!existed) throw new BadRequestException('Appointment not found')
    return await this.appoinmentRepository.deleteAppointment(id)
  }

  async findAppointmentById(id: number): Promise<AppointmentResponseType> {
    const existed = await this.appoinmentRepository.findAppointmentById(id)
    if (!existed) throw new BadRequestException('Appointment not found')
    return existed
  }

  async findAppointmentByUserId(id: number): Promise<AppointmentResponseType[]> {
    const user = await this.userRepository.findUserById(id)
    if (!user) throw new BadRequestException('User not found')
    const existed = await this.appoinmentRepository.findAppointmentByUserId(id)
    return existed
  }

  async findAppointmentByDoctorId(id: number): Promise<AppointmentResponseType[]> {
    const doctor = await this.userRepository.findUserById(id)
    if (!doctor) throw new BadRequestException('Doctor not found')
    const existed = await this.appoinmentRepository.findAppointmentByDoctorId(id)
    return existed
  }

  async findAppointmentsPaginated(query: unknown): Promise<PaginatedResponse<AppointmentResponseType>> {
    // Tách các trường filter ra khỏi query
    const { serviceId, status, type, dateFrom, dateTo, ...rest } = query as any

    // Gom các trường filter vào object filters
    const filters: any = {}
    if (serviceId !== undefined) filters.serviceId = Number(serviceId)
    if (status !== undefined) filters.status = status
    if (type !== undefined) filters.type = type
    if (dateFrom !== undefined) filters.dateFrom = dateFrom
    if (dateTo !== undefined) filters.dateTo = dateTo

    // Tạo query mới có trường filters (dưới dạng JSON string)
    const newQuery = {
      ...rest,
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    }

    // Tiếp tục như cũ
    const options = this.paginationService.getPaginationOptions(newQuery)
    return await this.appoinmentRepository.findAppointmentsPaginated(options)
  }
}
