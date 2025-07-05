import { Module } from '@nestjs/common'
import { AppoinmentRepository } from '../../../../repositories/appoinment.repository'
import { DoctorRepository } from '../../../../repositories/doctor.repository'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'
import { ServiceRepository } from '../../../../repositories/service.repository'
import { TreatmentProtocolRepository } from '../../../../repositories/treatment-protocol.repository'
import { AuthRepository } from '../../../../repositories/user.repository'
import { PaginationService } from '../../../../shared/services/pagination.service'
import { PrismaService } from '../../../../shared/services/prisma.service'
import { SharedErrorHandlingService } from '../../../../shared/services/error-handling.service'
import { TestPatientTreatmentController } from '../../controllers/test-patient-treatment.controller'
import { PatientTreatmentService } from '../../patient-treatment.service'
import { FollowUpAppointmentService } from '../../services/follow-up-appointment.service'
import {
  PatientTreatmentAnalyticsService,
  PatientTreatmentCoreService,
  PatientTreatmentManagementService,
  PatientTreatmentValidationService,
} from '../index'

@Module({
  controllers: [TestPatientTreatmentController],
  providers: [
    PatientTreatmentService,
    FollowUpAppointmentService,
    PatientTreatmentRepository,
    AppoinmentRepository,
    ServiceRepository,
    DoctorRepository,
    TreatmentProtocolRepository,
    AuthRepository,
    PrismaService,
    PaginationService,
    SharedErrorHandlingService,
    PatientTreatmentAnalyticsService,
    PatientTreatmentValidationService,
    PatientTreatmentCoreService,
    PatientTreatmentManagementService,
  ],
  exports: [PatientTreatmentService, FollowUpAppointmentService],
})
export class TestPatientTreatmentModule {}
