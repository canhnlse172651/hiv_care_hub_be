import { Module } from '@nestjs/common'
import { AppoinmentRepository } from '../../repositories/appoinment.repository'
import { DoctorRepository } from '../../repositories/doctor.repository'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { ServiceRepository } from '../../repositories/service.repository'
import { TestResultRepository } from '../../repositories/test-result.repository'
import { TreatmentProtocolRepository } from '../../repositories/treatment-protocol.repository'
import { AuthRepository } from '../../repositories/user.repository'
import { SharedErrorHandlingService } from '../../shared/services/error-handling.service'
import { PaginationService } from '../../shared/services/pagination.service'
import { PrismaService } from '../../shared/services/prisma.service'
import { PatientTreatmentController } from './patient-treatment.controller'
import { PatientTreatmentService } from './patient-treatment.service'
import {
  DoctorProtocolAuthorizationService,
  EmergencyProtocolService,
  FollowUpAppointmentService,
  OrganFunctionService,
  PatientTreatmentBulkService,
  PatientTreatmentBusinessService,
  PatientTreatmentQueryService,
  PatientTreatmentStatsService,
  PregnancySafetyService,
  ResistancePatternService,
  TreatmentAdherenceService,
  TreatmentContinuityService,
  ViralLoadMonitoringService,
} from './services'

@Module({
  imports: [],
  controllers: [PatientTreatmentController],
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
    TestResultRepository,
    PatientTreatmentStatsService,
    PatientTreatmentBulkService,
    PatientTreatmentBusinessService,
    PatientTreatmentQueryService,
    OrganFunctionService,
    ResistancePatternService,
    ViralLoadMonitoringService,
    PregnancySafetyService,
    TreatmentAdherenceService,
    DoctorProtocolAuthorizationService,
    TreatmentContinuityService,
    EmergencyProtocolService,
  ],
  exports: [PatientTreatmentService],
})
export class PatientTreatmentModule {}
