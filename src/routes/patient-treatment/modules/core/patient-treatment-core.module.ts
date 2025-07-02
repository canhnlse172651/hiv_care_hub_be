import { Module } from '@nestjs/common'
import { AppoinmentRepository } from '../../../../repositories/appoinment.repository'
import { DoctorRepository } from '../../../../repositories/doctor.repository'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'
import { ServiceRepository } from '../../../../repositories/service.repository'
import { TreatmentProtocolRepository } from '../../../../repositories/treatment-protocol.repository'
import { AuthRepository } from '../../../../repositories/user.repository'
import { PaginationService } from '../../../../shared/services/pagination.service'
import { PrismaService } from '../../../../shared/services/prisma.service'
import { FollowUpAppointmentService } from '../../services/follow-up-appointment.service'
import { PatientTreatmentCoreController } from './patient-treatment-core.controller'
import { PatientTreatmentCoreService } from './patient-treatment-core.service'

@Module({
  controllers: [PatientTreatmentCoreController],
  providers: [
    PatientTreatmentCoreService,
    PatientTreatmentRepository,
    PrismaService,
    PaginationService,
    FollowUpAppointmentService,
    AppoinmentRepository,
    ServiceRepository,
    DoctorRepository,
    AuthRepository,
    TreatmentProtocolRepository,
  ],
  exports: [PatientTreatmentCoreService],
})
export class PatientTreatmentCoreModule {}
