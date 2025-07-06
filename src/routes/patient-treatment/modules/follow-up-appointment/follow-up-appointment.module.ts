import { Module } from '@nestjs/common'
import { AppoinmentRepository } from '../../../../repositories/appoinment.repository'
import { DoctorRepository } from '../../../../repositories/doctor.repository'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'
import { ServiceRepository } from '../../../../repositories/service.repository'
import { PaginationService } from '../../../../shared/services/pagination.service'
import { PrismaService } from '../../../../shared/services/prisma.service'
import { FollowUpAppointmentController } from '../../controllers/follow-up-appointment.controller'
import { FollowUpTestController } from '../../controllers/follow-up-test.controller'
import { FollowUpAppointmentService } from '../../services/follow-up-appointment.service'

@Module({
  controllers: [FollowUpAppointmentController, FollowUpTestController],
  providers: [
    FollowUpAppointmentService,
    AppoinmentRepository,
    PatientTreatmentRepository,
    ServiceRepository,
    DoctorRepository,
    PrismaService,
    PaginationService,
  ],
  exports: [FollowUpAppointmentService],
})
export class FollowUpAppointmentModule {}
