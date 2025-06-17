import { Module } from '@nestjs/common'
import { AppoinmentController } from './appoinment.controller'
import { AppoinmentService } from './appoinment.service'
import { AppoinmentRepository } from '../../repositories/appoinment.repository'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AuthRepository } from 'src/repositories/user.repository'
import { ServiceRepository } from 'src/repositories/service.repository'

@Module({
  controllers: [AppoinmentController],
  providers: [AppoinmentService, AppoinmentRepository, PrismaService, AuthRepository, ServiceRepository],
})
export class AppoinmentModule {}
