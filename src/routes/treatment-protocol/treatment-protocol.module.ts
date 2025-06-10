// filepath: /Users/nhatminh/Developer/hiv_care_hub_wdp_be/src/routes/treatment-protocol/treatment-protocol.module.ts
import { Module } from '@nestjs/common'
import { TreatmentProtocolController } from './treatment-protocol.controller'
import { TreatmentProtocolService } from './treatment-protocol.service'
import { TreatmentProtocolRepository } from '../../repositories/treatment-protocol.repository'
import { MedicineRepository } from '../../repositories/medicine.repository'

@Module({
  controllers: [TreatmentProtocolController],
  providers: [TreatmentProtocolService, TreatmentProtocolRepository, MedicineRepository],
  exports: [TreatmentProtocolService, TreatmentProtocolRepository],
})
export class TreatmentProtocolModule {}
