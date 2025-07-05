import { Injectable, NotFoundException } from '@nestjs/common'
import { ServiceRepository } from '../../repositories/service.repository'
import { CreateServiceReqType, ServiceResType, UpdateServiceReqType } from './service.model'
import { Service as PrismaServiceModel, ServiceType, Prisma } from '@prisma/client'
import { slugify } from 'src/shared/utils/slugify.utils'
import { QueryServiceSchema, QueryServiceType } from './service.query'
import { PaginationService } from 'src/shared/services/pagination.service'
import { PaginatedResponse, createPaginationSchema } from 'src/shared/schemas/pagination.schema'

function mapServiceToResponse(service: PrismaServiceModel): ServiceResType {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    price: service.price.toString(),
    type: service.type,
    description: service.description,
    startTime: service.startTime,
    endTime: service.endTime,
    duration: service.duration,
    imageUrl: service.imageUrl,
    content: service.content,
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  }
}

function randomSuffix(length = 3) {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

@Injectable()
export class ServiceService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createService(data: CreateServiceReqType): Promise<ServiceResType> {
    try {
      let slug = slugify(data.name)
      // Kiểm tra trùng slug
      let existed = await this.serviceRepository.findActiveServiceBySlug(slug)
      while (existed) {
        slug = `${slugify(data.name)}-${randomSuffix()}`
        existed = await this.serviceRepository.findActiveServiceBySlug(slug)
      }
      const prismaData = {
        ...data,
        slug,
        type: data.type as ServiceType,
        price: data.price,
        startTime: data.startTime, // string HH:mm
        endTime: data.endTime, // string HH:mm
        duration: data.duration, // string HH:mm, optional
        imageUrl: data.imageUrl ?? '',
        isActive: data.isActive ?? true,
      }
      const service = await this.serviceRepository.createService(prismaData)
      return mapServiceToResponse(service)
    } catch (error) {
      console.error('Create Service Error:', error)
      throw error
    }
  }

  async findAllServices(query?: any): Promise<PaginatedResponse<ServiceResType>> {
    // Nếu có query thì phân trang, nếu không thì lấy tất cả
    if (query) {
      return this.searchServices(query)
    }
    // fallback: lấy tất cả (không nên dùng trong production lớn)
    const services = await this.serviceRepository.findAllServices()
    return {
      data: services.map(mapServiceToResponse),
      meta: {
        total: services.length,
        page: 1,
        limit: services.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }
  }

  async findServiceById(id: number): Promise<ServiceResType> {
    const service = await this.serviceRepository.findServiceById(id)
    if (!service) throw new NotFoundException('Service not found')
    return mapServiceToResponse(service)
  }

  async updateService(id: number, data: UpdateServiceReqType): Promise<ServiceResType> {
    const existed = await this.serviceRepository.existsById(id)
    if (!existed) throw new NotFoundException('Service not found')
    const prismaData: Prisma.ServiceUpdateInput = {
      ...data,
      ...(data.type && Object.values(ServiceType).includes(data.type as ServiceType)
        ? { type: data.type as ServiceType }
        : {}),
      ...(typeof data.startTime === 'string' && { startTime: data.startTime }),
      ...(typeof data.endTime === 'string' && { endTime: data.endTime }),
      ...(typeof data.duration === 'string' && { duration: data.duration }),
    }
    if (typeof data.name === 'string') {
      let slug = slugify(data.name)
      // Kiểm tra trùng slug (bỏ qua chính mình)
      let existedSlug = await this.serviceRepository.findActiveServiceBySlug(slug)
      while (existedSlug && existedSlug.id !== id) {
        slug = `${slugify(data.name)}-${randomSuffix()}`
        existedSlug = await this.serviceRepository.findActiveServiceBySlug(slug)
      }
      prismaData.slug = slug
    }
    const service = await this.serviceRepository.updateService(id, prismaData)
    return mapServiceToResponse(service)
  }

  async removeService(id: number): Promise<ServiceResType> {
    const existed = await this.serviceRepository.existsById(id)
    if (!existed) throw new NotFoundException('Service not found')
    const service = await this.serviceRepository.removeService(id)
    return mapServiceToResponse(service)
  }

  async findAllActiveServicesBySlug(query?: any): Promise<PaginatedResponse<ServiceResType>> {
    const { type, isActive, ...rest } = query // Gom các trường filter vào object filters
    const filters: Record<string, any> = {}
    if (type !== undefined) filters.type = type
    if (isActive !== undefined) filters.isActive = isActive
    const newQuery = {
      ...rest,
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    }
    const options = this.paginationService.getPaginationOptions(newQuery)
    return await this.serviceRepository.findAllActiveServicesBySlug(options)
  }

  async findServiceBySlug(slug: string): Promise<ServiceResType> {
    const service = await this.serviceRepository.findActiveServiceBySlug(slug)
    if (!service) throw new NotFoundException('Service not found')
    return mapServiceToResponse(service)
  }

  async searchServices(query?: any): Promise<PaginatedResponse<ServiceResType>> {
    const { type, isActive, ...rest } = query // Gom các trường filter vào object filters
    const filters: Record<string, any> = {}
    if (type !== undefined) filters.type = type
    if (isActive !== undefined) filters.isActive = isActive
    const newQuery = {
      ...rest,
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    }
    const options = this.paginationService.getPaginationOptions(newQuery)
    return await this.serviceRepository.searchServices(options)
  }
}
