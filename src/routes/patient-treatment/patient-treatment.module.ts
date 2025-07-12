import { Module } from '@nestjs/common'
import { AppoinmentRepository } from '../../repositories/appoinment.repository'
import { DoctorRepository } from '../../repositories/doctor.repository'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { ServiceRepository } from '../../repositories/service.repository'
import { TreatmentProtocolRepository } from '../../repositories/treatment-protocol.repository'
import { AuthRepository } from '../../repositories/user.repository'
import { SharedErrorHandlingService } from '../../shared/services/error-handling.service'
import { PaginationService } from '../../shared/services/pagination.service'
import { PrismaService } from '../../shared/services/prisma.service'
import {
  PatientTreatmentAnalyticsService,
  PatientTreatmentCoreService,
  PatientTreatmentManagementService,
  PatientTreatmentValidationService,
} from './modules'
import { PatientTreatmentAnalyticsModule } from './modules/analytics/patient-treatment-analytics.module'
import { PatientTreatmentCoreModule } from './modules/core/patient-treatment-core.module'
import { FollowUpAppointmentModule } from './modules/follow-up-appointment/follow-up-appointment.module'
import { PatientTreatmentManagementModule } from './modules/management/patient-treatment-management.module'
import { TestPatientTreatmentModule } from './modules/test/patient-treatment-test.module'
import { PatientTreatmentValidationModule } from './modules/validation/patient-treatment-validation.module'
import { PatientTreatmentService } from './patient-treatment.service'
import { FollowUpAppointmentService } from './services/follow-up-appointment.service'

@Module({
  imports: [
    PatientTreatmentCoreModule,
    PatientTreatmentAnalyticsModule,
    PatientTreatmentValidationModule,
    PatientTreatmentManagementModule,
    FollowUpAppointmentModule,
    TestPatientTreatmentModule,
  ],
  providers: [
    PatientTreatmentService,
    PatientTreatmentRepository,
    AppoinmentRepository,
    DoctorRepository,
    ServiceRepository,
    TreatmentProtocolRepository,
    AuthRepository,
    PrismaService,
    PaginationService,
    SharedErrorHandlingService,
    FollowUpAppointmentService,
    PatientTreatmentAnalyticsService,
    PatientTreatmentValidationService,
    PatientTreatmentCoreService,
    PatientTreatmentManagementService,
  ],
  exports: [
    PatientTreatmentService,
    PatientTreatmentCoreModule,
    PatientTreatmentAnalyticsModule,
    PatientTreatmentValidationModule,
    PatientTreatmentManagementModule,
    FollowUpAppointmentModule,
    TestPatientTreatmentModule,
  ],
})
export class PatientTreatmentModule {}
