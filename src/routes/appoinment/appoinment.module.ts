import { Module } from '@nestjs/common'
import { AppoinmentController } from './appoinment.controller'
import { AppoinmentService } from './appoinment.service'
import { AppoinmentRepository } from '../../repositories/appoinment.repository'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AuthRepository } from 'src/repositories/user.repository'
import { ServiceRepository } from 'src/repositories/service.repository'
import { DoctorRepository } from 'src/repositories/doctor.repository'
import { MeetingService } from '../meeting/meeting.service'
import { EmailService } from 'src/shared/services/email.service'

@Module({
  controllers: [AppoinmentController],
  providers: [
    AppoinmentService,
    AppoinmentRepository,
    PrismaService,
    AuthRepository,
    ServiceRepository,
    DoctorRepository,
    MeetingService,
    EmailService,
  ],
})
export class AppoinmentModule {}
