import { Module } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'
import { PaginationService } from '../../../../shared/services/pagination.service'
import { PrismaService } from '../../../../shared/services/prisma.service'
import { PatientTreatmentAnalyticsController } from './patient-treatment-analytics.controller'
import { PatientTreatmentAnalyticsService } from './patient-treatment-analytics.service'

@Module({
  controllers: [PatientTreatmentAnalyticsController],
  providers: [PatientTreatmentAnalyticsService, PatientTreatmentRepository, PrismaService, PaginationService],
  exports: [PatientTreatmentAnalyticsService],
})
export class PatientTreatmentAnalyticsModule {}
