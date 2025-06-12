import { Module } from '@nestjs/common'
import { MedicineController } from './medicine.controller'
import { MedicineService } from './medicine.service'
import { MedicineRepository } from '../../repositories/medicine.repository'

@Module({
  controllers: [MedicineController],
  providers: [MedicineService, MedicineRepository],
  exports: [MedicineService, MedicineRepository],
})
export class MedicineModule {}
