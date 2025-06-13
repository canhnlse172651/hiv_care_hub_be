import { Module } from '@nestjs/common'
import { ServiceRepository } from '../../repositories/service.repository'
import { PrismaService } from '../../shared/services/prisma.service'
import { ServiceController } from './service.controller'
import { ServiceService } from './service.service'

@Module({
  controllers: [ServiceController],
  providers: [ServiceService, ServiceRepository, PrismaService],
})
export class ServiceModule {}
