import { Module } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'
import { PaginationService } from '../../../../shared/services/pagination.service'
import { PrismaService } from '../../../../shared/services/prisma.service'
import { PatientTreatmentManagementController } from './patient-treatment-management.controller'
import { PatientTreatmentManagementService } from './patient-treatment-management.service'

@Module({
  controllers: [PatientTreatmentManagementController],
  providers: [PatientTreatmentManagementService, PatientTreatmentRepository, PrismaService, PaginationService],
  exports: [PatientTreatmentManagementService],
})
export class PatientTreatmentManagementModule {}
