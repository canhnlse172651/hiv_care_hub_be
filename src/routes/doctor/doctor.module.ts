import { Module } from '@nestjs/common';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { DoctorRepository } from '../../repositories/doctor.repository';
import { PrismaService } from '../../shared/services/prisma.service';

@Module({
  controllers: [DoctorController],
  providers: [
    DoctorService,
    DoctorRepository,
    PrismaService,
    
  ],
  exports: [DoctorService],
})
export class DoctorModule {}
