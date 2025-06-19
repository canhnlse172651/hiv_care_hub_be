import { BadRequestException, Injectable } from '@nestjs/common'
import { AppoinmentRepository } from '../../repositories/appoinment.repository'
import { AppointmentResponseType, CreateAppointmentDtoType, UpdateAppointmentDtoType } from './appoinment.dto'
import { PaginatedResponse, PaginationOptions } from 'src/shared/schemas/pagination.schema'
import { AppointmentStatus } from '@prisma/client'
import { AuthRepository } from 'src/repositories/user.repository'
import { ServiceRepository } from 'src/repositories/service.repository'
import { PaginationService } from 'src/shared/services/pagination.service'
import { formatTimeHHMM, isTimeBetween } from 'src/shared/utils/date.utils'
import { DoctorRepository } from 'src/repositories/doctor.repository'

const slots = [
  { start: '07:00', end: '07:30' },
  { start: '07:35', end: '08:05' },
  { start: '08:10', end: '08:40' },
  { start: '08:45', end: '09:15' },
  { start: '09:20', end: '09:50' },
  { start: '09:55', end: '10:25' },
  { start: '10:30', end: '11:00' },
  { start: '13:00', end: '13:30' },
  { start: '13:35', end: '14:05' },
  { start: '14:10', end: '14:40' },
  { start: '14:45', end: '15:15' },
  { start: '15:20', end: '15:50' },
  { start: '15:55', end: '16:25' },
  { start: '16:30', end: '17:00' },
]

@Injectable()
export class AppoinmentService {
  constructor(
    private readonly appoinmentRepository: AppoinmentRepository,
    private readonly userRepository: AuthRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly paginationService: PaginationService,
    private readonly doctorRepository: DoctorRepository,
  ) {}

  async createAppointment(data: CreateAppointmentDtoType): Promise<AppointmentResponseType> {
    const user = await this.userRepository.findUserById(data.userId)
    if (!user) throw new BadRequestException('User not found')

    const doctor = await this.doctorRepository.findDoctorById(data.doctorId)
    if (!doctor) throw new BadRequestException('Doctor not found')

    const service = await this.serviceRepository.findServiceById(data.serviceId)
    if (!service) throw new BadRequestException('Service not found')

    if (data.appointmentTime < new Date()) throw new BadRequestException('Appointment time cannot be in the past')

    // Format the appointment time to HH:MM format for comparison with service hours
    const appointmentTimeFormatted = formatTimeHHMM(data.appointmentTime)
    const slot = slots.find((s) => s.start === appointmentTimeFormatted)
    if (!slot) {
      throw new BadRequestException('This slot is not available for appointment')
    }

    // Check if appointment time is within service hours using the utility function
    if (!isTimeBetween(appointmentTimeFormatted, service.startTime, service.endTime)) {
      throw new BadRequestException('Appointment time must be within service working hours')
    }

    const shift = data.appointmentTime.getHours() - 7 < 11 ? 'MORNING' : 'AFTERNOON'

    const date = new Date(data.appointmentTime).toISOString().slice(0, 10)
    const doctors = await this.doctorRepository.findDoctorByDate(new Date(date))
    const hasSchedule = doctors.some((doc) =>
      doc.schedules.some(
        (sch) => sch.doctorId === data.doctorId && sch.date.toISOString().slice(0, 10) === date && sch.shift === shift,
      ),
    )

    if (!hasSchedule) {
      throw new BadRequestException('Doctor does not have a working shift at the selected time')
    }

    // Check if the slot is already booked
    const slotStart = new Date(data.appointmentTime)
    const [endHour, endMinute] = slot.end.split(':').map(Number)
    const slotEnd = new Date(
      slotStart.getFullYear(),
      slotStart.getMonth(),
      slotStart.getDate(),
      endHour + 7,
      endMinute,
      0,
      0,
    )

    const existingAppointment = await this.appoinmentRepository.getAppointmentByDoctorAndTime(
      data.doctorId,
      slotStart,
      slotEnd,
    )

    if (existingAppointment) {
      throw new BadRequestException('This slot is already booked')
    }

    return await this.appoinmentRepository.createAppointment(data)
  }

  async updateAppointment(id: number, data: UpdateAppointmentDtoType): Promise<AppointmentResponseType> {
    const existed = await this.appoinmentRepository.findAppointmentById(id)
    if (!existed) throw new BadRequestException('Appointment not found')

    // Nếu có thay đổi doctorId hoặc appointmentTime thì validate lại toàn bộ logic đặt lịch
    const doctorId = data.doctorId ?? existed.doctor.id
    const appointmentTime = data.appointmentTime ?? existed.appointmentTime
    const serviceId = data.serviceId ?? existed.service.id

    if (data.userId) {
      const user = await this.userRepository.findUserById(data.userId)
      if (!user) throw new BadRequestException('User not found')
    }

    const doctor = await this.doctorRepository.findDoctorById(doctorId)
    if (!doctor) throw new BadRequestException('Doctor not found')

    const service = await this.serviceRepository.findServiceById(serviceId)
    if (!service) throw new BadRequestException('Service not found')

    if (appointmentTime < new Date()) throw new BadRequestException('Appointment time cannot be in the past')

    // Format the appointment time to HH:MM format for comparison with service hours
    const appointmentTimeFormatted = formatTimeHHMM(appointmentTime)
    const slot = slots.find((s) => s.start === appointmentTimeFormatted)
    if (!slot) {
      throw new BadRequestException('This slot is not available for appointment')
    }

    // Check if appointment time is within service hours using the utility function
    if (!isTimeBetween(appointmentTimeFormatted, service.startTime, service.endTime)) {
      throw new BadRequestException('Appointment time must be within service working hours')
    }

    const shift = appointmentTime.getHours() - 7 < 11 ? 'MORNING' : 'AFTERNOON'
    const date = new Date(appointmentTime).toISOString().slice(0, 10)
    const doctors = await this.doctorRepository.findDoctorByDate(new Date(date))
    const hasSchedule = doctors.some((doc) =>
      doc.schedules.some(
        (sch) => sch.doctorId === doctorId && sch.date.toISOString().slice(0, 10) === date && sch.shift === shift,
      ),
    )
    if (!hasSchedule) {
      throw new BadRequestException('Doctor does not have a working shift at the selected time')
    }

    // Check if the slot is already booked (không tính chính lịch hẹn này)
    const slotStart = new Date(appointmentTime)
    const [endHour, endMinute] = slot.end.split(':').map(Number)
    const slotEnd = new Date(
      slotStart.getFullYear(),
      slotStart.getMonth(),
      slotStart.getDate(),
      endHour + 7,
      endMinute,
      0,
      0,
    )
    const existingAppointment = await this.appoinmentRepository.getAppointmentByDoctorAndTime(
      doctorId,
      slotStart,
      slotEnd,
    )
    if (existingAppointment && existingAppointment.id !== id) {
      throw new BadRequestException('This slot is already booked')
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
    const { serviceId, status, type, dateFrom, dateTo, ...rest } = query as any // Gom các trường filter vào object filters
    const filters: Record<string, any> = {}
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
