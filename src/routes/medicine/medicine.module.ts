import { Module } from '@nestjs/common'
import { MedicineRepository } from '../../repositories/medicine.repository'
import { PrismaService } from '../../shared/services/prisma.service'
import { MedicineController } from './medicine.controller'
import { MedicineService } from './medicine.service'

@Module({
  controllers: [MedicineController],
  providers: [MedicineService, MedicineRepository, PrismaService],
  exports: [MedicineService],
})
export class MedicineModule {}
