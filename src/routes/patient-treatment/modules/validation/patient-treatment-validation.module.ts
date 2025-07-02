import { Module } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'
import { PaginationService } from '../../../../shared/services/pagination.service'
import { PrismaService } from '../../../../shared/services/prisma.service'
import { PatientTreatmentValidationController } from './patient-treatment-validation.controller'
import { PatientTreatmentValidationService } from './patient-treatment-validation.service'

@Module({
  controllers: [PatientTreatmentValidationController],
  providers: [PatientTreatmentValidationService, PatientTreatmentRepository, PrismaService, PaginationService],
  exports: [PatientTreatmentValidationService],
})
export class PatientTreatmentValidationModule {}
