import { Module } from '@nestjs/common'
import { AppoinmentRepository } from '../../../repositories/appoinment.repository'
import { DoctorRepository } from '../../../repositories/doctor.repository'
import { PatientTreatmentRepository } from '../../../repositories/patient-treatment.repository'
import { ServiceRepository } from '../../../repositories/service.repository'
import { PaginationService } from '../../../shared/services/pagination.service'
import { PrismaService } from '../../../shared/services/prisma.service'
import { TestPatientTreatmentController } from '../controllers/test-patient-treatment.controller'
import { PatientTreatmentService } from '../patient-treatment.service'
import { FollowUpAppointmentService } from '../services/follow-up-appointment.service'

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
