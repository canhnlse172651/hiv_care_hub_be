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
import { PatientTreatmentService } from './patient-treatment.service'
import { FollowUpAppointmentService } from './services/follow-up-appointment.service'

@Module({
  imports: [],
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
  ],
  exports: [PatientTreatmentService],
})
export class PatientTreatmentModule {}
