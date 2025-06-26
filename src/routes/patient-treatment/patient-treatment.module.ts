import { Module } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
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
    PatientTreatmentRepository,
    PrismaService,
    PaginationService,
    PatientTreatmentAnalyticsService,
    PatientTreatmentValidationService,
    PatientTreatmentCoreService,
    PatientTreatmentManagementService,
  ],
  exports: [
    PatientTreatmentCoreModule,
    PatientTreatmentAnalyticsModule,
    PatientTreatmentValidationModule,
    PatientTreatmentManagementModule,
    FollowUpAppointmentModule,
    TestPatientTreatmentModule,
  ],
})
export class PatientTreatmentModule {}
