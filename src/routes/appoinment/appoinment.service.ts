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
import { MeetingService } from '../meeting/meeting.service'
import { EmailService } from 'src/shared/services/email.service'

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
    private readonly meetingService: MeetingService,
    private readonly emailService: EmailService,
  ) {}

  async createAppointment(data: CreateAppointmentDtoType): Promise<AppointmentResponseType> {
    const user = await this.userRepository.findUserById(data.userId)
    if (!user) throw new BadRequestException('User not found')

    if (data.appointmentTime < new Date()) throw new BadRequestException('Appointment time cannot be in the past')

    const service = await this.serviceRepository.findServiceById(data.serviceId)
    if (!service) throw new BadRequestException('Service not found')

    if (data.type === 'OFFLINE' && data.isAnonymous === true)
      throw new BadRequestException('Anonymous appointment must be online')

    if (
      (service.type === 'CONSULT' && data.type !== 'ONLINE') ||
      (service.type !== 'CONSULT' && data.type !== 'OFFLINE')
    ) {
      throw new BadRequestException('Invalid appointment type for this service')
    }

    if (service.type === 'CONSULT' && data.type === 'ONLINE') {
      if (data.doctorId) throw new BadRequestException('It is not possible to choose your own doctor for this service.')
      // Tìm slot
      const appointmentTimeFormatted = formatTimeHHMM(data.appointmentTime)
      const slot = slots.find((s) => s.start === appointmentTimeFormatted)
      if (!slot) throw new BadRequestException('This slot is not available for appointment')

      if (!isTimeBetween(appointmentTimeFormatted, service.startTime, service.endTime)) {
        throw new BadRequestException('Appointment time must be within service working hours')
      }

      const shift = data.appointmentTime.getHours() - 7 < 11 ? 'MORNING' : 'AFTERNOON'
      const date = new Date(data.appointmentTime).toISOString().slice(0, 10)
      const doctors = await this.doctorRepository.findDoctorByDate(new Date(date))
      // Lọc doctor có lịch làm việc ca đó
      const availableDoctors = doctors.filter((doc) =>
        doc.schedules.some((sch) => sch.date.toISOString().slice(0, 10) === date && sch.shift === shift),
      )
      // Lọc doctor chưa có appointment ở slot đó
      let foundDoctorId: number | null = null
      for (const doc of availableDoctors) {
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
          doc.id,
          slotStart,
          slotEnd,
        )
        if (!existingAppointment) {
          foundDoctorId = doc.id
          break
        }
      }
      if (!foundDoctorId) throw new BadRequestException('No available doctor for this slot')
      // Gán doctorId vào data
      data.doctorId = foundDoctorId
      console.log('data', data)

      // Tạo phòng meeting VideoSDK
      const roomId = `appointment-${Date.now()}-${data.userId}`
      const { patientUrl, doctorUrl } = await this.meetingService.createMeeting(roomId, {
        patientId: String(data.userId),
        doctorId: String(data.doctorId),
      })
      data.patientMeetingUrl = patientUrl
      data.doctorMeetingUrl = doctorUrl
    } else {
      if (!data.doctorId) throw new BadRequestException('Doctor ID is required for this appointment type')
      const doctor = await this.doctorRepository.findDoctorById(data.doctorId)
      if (!doctor) throw new BadRequestException('Doctor not found')
    }

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
    if (!data.doctorId) throw new BadRequestException('Doctor ID is required to check slot booking')
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
    if (data.type === 'ONLINE') {
      //gửi mail thông báo đặt lịch thành công
      await this.emailService.sendMeetingUrlMail({
        email: user.email,
        meetingUrl: data.patientMeetingUrl || '',
      })
      const doctor = await this.doctorRepository.findDoctorById(data.doctorId)
      const userDoctor = await this.userRepository.findUserById(Number(doctor?.userId))
      await this.emailService.sendMeetingUrlMail({
        email: userDoctor?.email || '',
        meetingUrl: data.doctorMeetingUrl || '',
      })
    }
    return await this.appoinmentRepository.createAppointment(data)
  }

  async updateAppointment(id: number, data: UpdateAppointmentDtoType): Promise<AppointmentResponseType> {
    const existed = await this.appoinmentRepository.findAppointmentById(id)
    if (!existed) throw new BadRequestException('Appointment not found')

    const doctorId = data.doctorId ?? existed.doctor.id
    const appointmentTime = data.appointmentTime ?? existed.appointmentTime
    const serviceId = data.serviceId ?? existed.service.id
    const type = data.type ?? existed.type
    const isAnonymous = data.isAnonymous ?? existed.isAnonymous

    if (data.userId) {
      const user = await this.userRepository.findUserById(data.userId)
      if (!user) throw new BadRequestException('User not found')
    }

    const service = await this.serviceRepository.findServiceById(serviceId)
    if (!service) throw new BadRequestException('Service not found')

    if (appointmentTime < new Date()) throw new BadRequestException('Appointment time cannot be in the past')

    if (type === 'OFFLINE' && isAnonymous === true)
      throw new BadRequestException('Anonymous appointment must be online')

    if ((service.type === 'CONSULT' && type !== 'ONLINE') || (service.type !== 'CONSULT' && type !== 'OFFLINE')) {
      throw new BadRequestException('Invalid appointment type for this service')
    }

    let finalDoctorId = doctorId

    if (service.type === 'CONSULT' && type === 'ONLINE') {
      if (data.doctorId) throw new BadRequestException('It is not possible to choose your own doctor for this service.')
      // Tìm slot và tự động chọn bác sĩ rảnh slot
      const appointmentTimeFormatted = formatTimeHHMM(appointmentTime)
      const slot = slots.find((s) => s.start === appointmentTimeFormatted)
      if (!slot) throw new BadRequestException('This slot is not available for appointment')

      if (!isTimeBetween(appointmentTimeFormatted, service.startTime, service.endTime)) {
        throw new BadRequestException('Appointment time must be within service working hours')
      }

      const shift = appointmentTime.getHours() - 7 < 11 ? 'MORNING' : 'AFTERNOON'
      const date = new Date(appointmentTime).toISOString().slice(0, 10)
      const doctors = await this.doctorRepository.findDoctorByDate(new Date(date))
      const availableDoctors = doctors.filter((doc) =>
        doc.schedules.some((sch) => sch.date.toISOString().slice(0, 10) === date && sch.shift === shift),
      )
      let foundDoctorId: number | null = null
      for (const doc of availableDoctors) {
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
          doc.id,
          slotStart,
          slotEnd,
        )
        if (!existingAppointment || existingAppointment.id === id) {
          foundDoctorId = doc.id
          break
        }
      }
      if (!foundDoctorId) throw new BadRequestException('No available doctor for this slot')
      finalDoctorId = foundDoctorId
    } else {
      if (!doctorId) throw new BadRequestException('Doctor ID is required for this appointment type')
      const doctor = await this.doctorRepository.findDoctorById(doctorId)
      if (!doctor) throw new BadRequestException('Doctor not found')
    }

    // Validate slot, lịch làm việc, trùng slot
    const appointmentTimeFormatted = formatTimeHHMM(appointmentTime)
    const slot = slots.find((s) => s.start === appointmentTimeFormatted)
    if (!slot) throw new BadRequestException('This slot is not available for appointment')

    if (!isTimeBetween(appointmentTimeFormatted, service.startTime, service.endTime)) {
      throw new BadRequestException('Appointment time must be within service working hours')
    }

    const shift = appointmentTime.getHours() - 7 < 11 ? 'MORNING' : 'AFTERNOON'
    const date = new Date(appointmentTime).toISOString().slice(0, 10)
    const doctors = await this.doctorRepository.findDoctorByDate(new Date(date))
    if (!finalDoctorId) throw new BadRequestException('Doctor ID is required to check slot booking')
    const hasSchedule = doctors.some((doc) =>
      doc.schedules.some(
        (sch) => sch.doctorId === finalDoctorId && sch.date.toISOString().slice(0, 10) === date && sch.shift === shift,
      ),
    )
    if (!hasSchedule) {
      throw new BadRequestException('Doctor does not have a working shift at the selected time')
    }

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
      finalDoctorId,
      slotStart,
      slotEnd,
    )
    if (existingAppointment && existingAppointment.id !== id) {
      throw new BadRequestException('This slot is already booked')
    }
    //

    // Gán lại doctorId vào data update
    return this.appoinmentRepository.updateAppointment(id, { ...data, doctorId: finalDoctorId })
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

  async findAppointmentByUserId(id: number, query: unknown): Promise<PaginatedResponse<AppointmentResponseType>> {
    const user = await this.userRepository.findUserById(id)
    if (!user) throw new BadRequestException('User not found')
    const { status, type, dateFrom, dateTo, serviceType, ...rest } = query as any
    const filters: Record<string, any> = {}
    if (status !== undefined) filters.status = status
    if (type !== undefined) filters.type = type
    if (dateFrom !== undefined) filters.dateFrom = dateFrom
    if (dateTo !== undefined) filters.dateTo = dateTo
    if (serviceType !== undefined) filters.serviceType = serviceType

    const newQuery = {
      ...rest,
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    }

    const options = this.paginationService.getPaginationOptions(newQuery)
    const existed = await this.appoinmentRepository.findAppointmentByUserId(id, options)
    return existed
  }

  async findAppointmentByDoctorId(id: number, query: unknown): Promise<PaginatedResponse<AppointmentResponseType>> {
    const doctor = await this.userRepository.findUserById(id)
    if (!doctor) throw new BadRequestException('Doctor not found')
    const { serviceId, status, type, dateFrom, dateTo, serviceType, ...rest } = query as any
    const filters: Record<string, any> = {}
    if (serviceId !== undefined) filters.serviceId = Number(serviceId)
    if (status !== undefined) filters.status = status
    if (type !== undefined) filters.type = type
    if (dateFrom !== undefined) filters.dateFrom = dateFrom
    if (dateTo !== undefined) filters.dateTo = dateTo
    if (serviceType !== undefined) filters.serviceType = serviceType

    const newQuery = {
      ...rest,
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    }

    const options = this.paginationService.getPaginationOptions(newQuery)
    const result = await this.appoinmentRepository.findAppointmentByDoctorId(id, options)
    return {
      ...result,
      data: (result.data = result.data.map((appointment) => {
        if (appointment.isAnonymous) {
          return {
            ...appointment,
            user: {
              id: 0,
              name: 'Ẩn danh',
              email: '',
              avatar: '',
            },
          }
        }
        return appointment
      })),
    }
  }

  async findAppointmentsPaginated(query: unknown): Promise<PaginatedResponse<AppointmentResponseType>> {
    // Tách các trường filter ra khỏi query
    const { serviceId, status, type, dateFrom, dateTo, serviceType, ...rest } = query as any // Gom các trường filter vào object filters
    const filters: Record<string, any> = {}
    if (serviceId !== undefined) filters.serviceId = Number(serviceId)
    if (status !== undefined) filters.status = status
    if (type !== undefined) filters.type = type
    if (dateFrom !== undefined) filters.dateFrom = dateFrom
    if (dateTo !== undefined) filters.dateTo = dateTo
    if (serviceType !== undefined) filters.serviceType = serviceType

    // Tạo query mới có trường filters (dưới dạng JSON string)
    const newQuery = {
      ...rest,
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    }

    // Tiếp tục như cũ
    const options = this.paginationService.getPaginationOptions(newQuery)
    return await this.appoinmentRepository.findAppointmentsPaginated(options)
  }

  async findAppointmentsPaginatedByStaff(query: unknown): Promise<PaginatedResponse<AppointmentResponseType>> {
    const result = await this.findAppointmentsPaginated(query)
    result.data = result.data.map((appointment) => {
      if (appointment.isAnonymous) {
        return {
          ...appointment,
          user: {
            id: 0,
            name: 'Ẩn danh',
            email: '',
            avatar: '',
          },
        }
      }
      return appointment
    })
    return result
  }
}
