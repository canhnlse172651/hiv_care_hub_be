import { Module } from '@nestjs/common'
import { DoctorRepository } from 'src/repositories/doctor.repository'
import { ServiceRepository } from 'src/repositories/service.repository'
import { AuthRepository } from 'src/repositories/user.repository'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AppoinmentRepository } from '../../repositories/appoinment.repository'
import { AppoinmentController } from './appoinment.controller'
import { AppoinmentService } from './appoinment.service'

import { EmailService } from 'src/shared/services/email.service'
import { MeetingService } from '../meeting/meeting.service'
import { PatientTreatmentModule } from '../patient-treatment/patient-treatment.module'
import { ReminderService } from '../reminder/reminder.service'
import { AppointmentHistoryRepository } from './appointment-history.repository'
import { AppointmentHistoryService } from './appointment-history.service'

@Module({
  imports: [PatientTreatmentModule],
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
    AppointmentHistoryService,
    AppointmentHistoryRepository,
    ReminderService,
  ],
  exports: [
    AppoinmentService,
    AppointmentHistoryService,
    ReminderService,
    PrismaService,
    AuthRepository,
    ServiceRepository,
    DoctorRepository,
  ],
})
export class AppoinmentModule {}
