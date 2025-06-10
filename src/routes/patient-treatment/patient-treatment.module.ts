import { Module } from '@nestjs/common'
import { PatientTreatmentController } from './patient-treatment.controller'
import { PatientTreatmentService } from './patient-treatment.service'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'

@Module({
  controllers: [PatientTreatmentController],
  providers: [PatientTreatmentService, PatientTreatmentRepository],
  exports: [PatientTreatmentService, PatientTreatmentRepository],
})
export class PatientTreatmentModule {}
