import { Injectable, NotFoundException } from '@nestjs/common'
import { ServiceRepository } from '../../repositories/service.repository'
import { CreateServiceReqType, ServiceResType, UpdateServiceReqType } from './service.model'
import { Service as PrismaServiceModel, ServiceType, Prisma } from '@prisma/client'
import { slugify } from 'src/shared/utils/slugify.utils'

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
    imageUrl: service.imageUrl,
    content: service.content,
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  }
}

@Injectable()
export class ServiceService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async createService(data: CreateServiceReqType): Promise<ServiceResType> {
    try {
      const slug = slugify(data.name)
      const prismaData = {
        ...data,
        slug,
        type: data.type as ServiceType,
        price: data.price,
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

  async findAllServices(): Promise<ServiceResType[]> {
    const services = await this.serviceRepository.findAllServices()
    return services.map(mapServiceToResponse)
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
      ...(typeof data.name === 'string' && { slug: slugify(data.name) }),
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

  async findAllActiveServicesBySlug(): Promise<ServiceResType[]> {
    const services = await this.serviceRepository.findAllActiveServicesBySlug()
    return services.map(mapServiceToResponse)
  }

  async findServiceBySlug(slug: string): Promise<ServiceResType> {
    const service = await this.serviceRepository.findActiveServiceBySlug(slug)
    if (!service) throw new NotFoundException('Service not found')
    return mapServiceToResponse(service)
  }

}
