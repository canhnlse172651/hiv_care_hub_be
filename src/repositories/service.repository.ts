import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'
import { Prisma } from '@prisma/client'
import { createPaginationSchema, PaginatedResponse, PaginationOptions } from 'src/shared/schemas/pagination.schema'
import { ServiceResType } from 'src/routes/service/service.model'
import { PaginationService } from 'src/shared/services/pagination.service'
import { QueryServiceSchema } from 'src/routes/service/service.query'

@Injectable()
export class ServiceRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async createService(data: Prisma.ServiceCreateInput) {
    return this.prisma.service.create({ data })
  }

  async findAllServices() {
    return this.prisma.service.findMany()
  }

  async findServiceById(id: number) {
    return this.prisma.service.findUnique({ where: { id } })
  }

  async updateService(id: number, data: Prisma.ServiceUpdateInput) {
    return this.prisma.service.update({ where: { id }, data })
  }

  async removeService(id: number) {
    return this.prisma.service.delete({ where: { id } })
  }

  async findActiveServiceBySlug(slug: string) {
    return this.prisma.service.findFirst({
      where: {
        slug,
        isActive: true,
      },
    })
  }

  async findAllActiveServicesBySlug(options: PaginationOptions<any>): Promise<PaginatedResponse<ServiceResType>> {
    const paginationSchema = createPaginationSchema(QueryServiceSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields || ['name'],
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: any = {
      isActive: true,
    }

    // Search functionality
    if (validatedOptions.search) {
      where.OR = (validatedOptions.searchFields || ['name']).map((field) => ({
        [field]: { contains: validatedOptions.search, mode: 'insensitive' },
      }))
    }

    // Filter functionality
    if (validatedOptions.filters) {
      const { type } = validatedOptions.filters

      if (type !== undefined) where.type = type
    }

    const orderBy: any = {}
    if (validatedOptions.sortBy) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    return this.paginationService.paginate(this.prisma.service, validatedOptions, where)
  }

  async updateServiceActive(id: number, isActive: boolean) {
    return this.prisma.service.update({
      where: { id },
      data: { isActive },
    })
  }

  async existsById(id: number) {
    const service = await this.prisma.service.findUnique({ where: { id }, select: { id: true } })
    return !!service
  }

  getServiceModel() {
    return this.prisma.service
  }

  async searchServices(options: PaginationOptions<any>): Promise<PaginatedResponse<ServiceResType>> {
    const paginationSchema = createPaginationSchema(QueryServiceSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields || ['name'],
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })

    const where: any = {}

    // Search functionality
    if (validatedOptions.search) {
      where.OR = (validatedOptions.searchFields || ['name']).map((field) => ({
        [field]: { contains: validatedOptions.search, mode: 'insensitive' },
      }))
    }

    // Filter functionality
    if (validatedOptions.filters) {
      const { isActive, type } = validatedOptions.filters

      if (isActive !== undefined) where.isActive = isActive
      if (type !== undefined) where.type = type
    }

    const orderBy: any = {}
    if (validatedOptions.sortBy) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    return this.paginationService.paginate(this.prisma.service, validatedOptions, where)
  }
}
