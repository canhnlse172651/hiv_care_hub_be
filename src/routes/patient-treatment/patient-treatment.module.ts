import { Module } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { PrismaService } from '../../shared/services/prisma.service'
import { PatientTreatmentController } from './patient-treatment.controller'
import { PatientTreatmentService } from './patient-treatment.service'

@Module({
  controllers: [PatientTreatmentController],
  providers: [PatientTreatmentService, PatientTreatmentRepository, PrismaService],
  exports: [PatientTreatmentService],
})
export class PatientTreatmentModule {}
