import { Injectable } from '@nestjs/common'
import { AppointmentStatus, AppointmentType } from '@prisma/client'
import {
  AppointmentResponseType,
  CreateAppointmentDtoType,
  UpdateAppointmentDtoType,
} from '../routes/appoinment/appoinment.dto'
import { AppointmentFilterSchema } from '../routes/appoinment/appoinment.model'
import { createPaginationSchema, PaginatedResponse, PaginationOptions } from '../shared/schemas/pagination.schema'
import { PaginationService } from '../shared/services/pagination.service'
import { PrismaService } from '../shared/services/prisma.service'

@Injectable()
export class AppoinmentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  private readonly includeRelations = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    },
    doctor: {
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    },
    service: {
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        price: true,
        startTime: true,
        endTime: true,
        content: true,
      },
    },
  }

  getModel() {
    return this.prisma.appointment
  }

  async createAppointment(data: CreateAppointmentDtoType): Promise<AppointmentResponseType> {
    const prismaData = {
      ...data,
      type: data.type as AppointmentType,
      status: data.status as AppointmentStatus,
      doctorId: data.doctorId!,
    }

    const appointment = await this.prisma.appointment.create({
      data: prismaData,
      include: this.includeRelations,
    })

    // Flatten doctor.user into doctor
    const doctorUser = appointment.doctor?.user
    const doctor = doctorUser
      ? {
          id: appointment.doctor.id,
          name: doctorUser.name,
          email: doctorUser.email,
          avatar: doctorUser.avatar,
        }
      : null

    return {
      ...appointment,
      doctor,
    } as AppointmentResponseType
  }

  async updateAppointment(id: number, data: UpdateAppointmentDtoType): Promise<AppointmentResponseType> {
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data,
      include: this.includeRelations,
    })

    // Flatten doctor.user into doctor
    const doctorUser = appointment.doctor?.user
    const doctor = doctorUser
      ? {
          id: appointment.doctor.id,
          name: doctorUser.name,
          email: doctorUser.email,
          avatar: doctorUser.avatar,
        }
      : null

    return {
      ...appointment,
      doctor,
    } as AppointmentResponseType
  }

  async updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<AppointmentResponseType> {
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: this.includeRelations,
    })

    // Flatten doctor.user into doctor
    const doctorUser = appointment.doctor?.user
    const doctor = doctorUser
      ? {
          id: appointment.doctor.id,
          name: doctorUser.name,
          email: doctorUser.email,
          avatar: doctorUser.avatar,
        }
      : null

    return {
      ...appointment,
      doctor,
    } as AppointmentResponseType
  }

  async deleteAppointment(id: number): Promise<AppointmentResponseType> {
    const appointment = await this.prisma.appointment.delete({
      where: { id },
      include: this.includeRelations,
    })

    // Flatten doctor.user into doctor
    const doctorUser = appointment.doctor?.user
    const doctor = doctorUser
      ? {
          id: appointment.doctor.id,
          name: doctorUser.name,
          email: doctorUser.email,
          avatar: doctorUser.avatar,
        }
      : null

    return {
      ...appointment,
      doctor,
    } as AppointmentResponseType
  }

  async findAppointmentById(id: number): Promise<AppointmentResponseType | null> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: this.includeRelations,
    })

    if (!appointment) return null

    // Flatten doctor.user into doctor
    const doctorUser = appointment.doctor?.user
    const doctor = doctorUser
      ? {
          id: appointment.doctor.id,
          name: doctorUser.name,
          email: doctorUser.email,
          avatar: doctorUser.avatar,
        }
      : null

    return {
      ...appointment,
      doctor,
    } as AppointmentResponseType
  }

  async findAppointmentByUserId(
    id: number,
    options: PaginationOptions<any>,
  ): Promise<PaginatedResponse<AppointmentResponseType>> {
    const paginationSchema = createPaginationSchema(AppointmentFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields || ['notes'],
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: any = {
      userId: id,
    }

    if (validatedOptions.search) {
      where.OR = (validatedOptions.searchFields || ['notes']).map((field) => ({
        [field]: { contains: validatedOptions.search, mode: 'insensitive' },
      }))
    }

    // Filter functionality
    if (validatedOptions.filters) {
      const { status, type, dateFrom, dateTo, serviceType } = validatedOptions.filters

      if (status) where.status = status
      if (type) where.type = type
      if (serviceType) {
        where.service = {
          type: serviceType,
        }
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.appointmentTime = {}
        if (dateFrom) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          where.appointmentTime.gte = new Date(dateFrom)
        }
        if (dateTo) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          where.appointmentTime.lte = new Date(dateTo)
        }
      }
    }

    // Sorting
    const orderBy: any = {}
    if (validatedOptions.sortBy) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder || 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    return this.paginationService.paginate(this.prisma.appointment, validatedOptions, where, this.includeRelations)
  }

  async findAppointmentByDoctorId(
    id: number,
    options: PaginationOptions<any>,
  ): Promise<PaginatedResponse<AppointmentResponseType>> {
    const paginationSchema = createPaginationSchema(AppointmentFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields || ['notes'],
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: any = {
      doctorId: id,
    }

    // Search functionality
    if (validatedOptions.search) {
      where.OR = (validatedOptions.searchFields || ['notes']).map((field) => ({
        [field]: { contains: validatedOptions.search, mode: 'insensitive' },
      }))
    }

    // Filter functionality
    if (validatedOptions.filters) {
      const { serviceId, status, type, dateFrom, dateTo, serviceType } = validatedOptions.filters

      if (serviceId) where.serviceId = serviceId
      if (status) where.status = status
      if (type) where.type = type
      if (serviceType) {
        where.service = {
          type: serviceType,
        }
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.appointmentTime = {}
        if (dateFrom) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          where.appointmentTime.gte = new Date(dateFrom)
        }
        if (dateTo) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          where.appointmentTime.lte = new Date(dateTo)
        }
      }
    }

    // Sorting
    const orderBy: any = {}
    if (validatedOptions.sortBy) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder || 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    return this.paginationService.paginate(this.prisma.appointment, validatedOptions, where, this.includeRelations)
  }

  async findAppointmentsPaginated(
    options: PaginationOptions<any>,
  ): Promise<PaginatedResponse<AppointmentResponseType>> {
    const paginationSchema = createPaginationSchema(AppointmentFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields || ['notes'],
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: any = {}

    // Search functionality
    if (validatedOptions.search) {
      where.OR = (validatedOptions.searchFields || ['notes']).map((field) => ({
        [field]: { contains: validatedOptions.search, mode: 'insensitive' },
      }))
    }

    // Filter functionality
    if (validatedOptions.filters) {
      const { serviceId, status, type, dateFrom, dateTo, serviceType } = validatedOptions.filters

      if (serviceId) where.serviceId = serviceId
      if (status) where.status = status
      if (type) where.type = type
      if (serviceType) {
        where.service = {
          type: serviceType,
        }
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.appointmentTime = {}
        if (dateFrom) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          where.appointmentTime.gte = new Date(dateFrom)
        }
        if (dateTo) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          where.appointmentTime.lte = new Date(dateTo)
        }
      }
    }

    // Sorting
    const orderBy: any = {}
    if (validatedOptions.sortBy) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder || 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    return this.paginationService.paginate(this.prisma.appointment, validatedOptions, where, this.includeRelations)
  }

  async getAppointmentByDoctorAndTime(doctorId: number, slotStart: Date, slotEnd: Date) {
    return this.prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentTime: { gte: slotStart, lt: slotEnd },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
    })
  }
}
