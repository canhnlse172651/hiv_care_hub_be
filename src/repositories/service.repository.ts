import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class ServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAllActiveServicesBySlug(slug?: string) {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
      },
    })
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
}
