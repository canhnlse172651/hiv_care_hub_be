import { Module } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { PatientTreatmentController } from './patient-treatment.controller'
import { PatientTreatmentService } from './patient-treatment.service'

@Module({
  controllers: [PatientTreatmentController],
  providers: [PatientTreatmentService, PatientTreatmentRepository],
  exports: [PatientTreatmentService, PatientTreatmentRepository],
})
export class PatientTreatmentModule {}
