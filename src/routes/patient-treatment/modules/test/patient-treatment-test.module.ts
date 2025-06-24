import { Module } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'
import { AppoinmentRepository } from '../../../../repositories/appoinment.repository'
import { ServiceRepository } from '../../../../repositories/service.repository'
import { DoctorRepository } from '../../../../repositories/doctor.repository'
import { PrismaService } from '../../../../shared/services/prisma.service'
import { PaginationService } from '../../../../shared/services/pagination.service'
import { FollowUpAppointmentService } from '../../services/follow-up-appointment.service'
import { PatientTreatmentService } from '../../patient-treatment.service'
import { TestPatientTreatmentController } from '../../controllers/test-patient-treatment.controller'

@Module({
  controllers: [TestPatientTreatmentController],
  providers: [
    PatientTreatmentService,
    FollowUpAppointmentService,
    PatientTreatmentRepository,
    AppoinmentRepository,
    ServiceRepository,
    DoctorRepository,
    PrismaService,
    PaginationService,
  ],
  exports: [PatientTreatmentService, FollowUpAppointmentService],
})
export class TestPatientTreatmentModule {}
