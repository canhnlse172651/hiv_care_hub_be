import { Module } from '@nestjs/common'
import { TreatmentProtocolRepository } from '../../repositories/treatment-protocol.repository'
import { PrismaService } from '../../shared/services/prisma.service'
import { TreatmentProtocolController } from './treatment-protocol.controller'
import { TreatmentProtocolService } from './treatment-protocol.service'

@Module({
  controllers: [TreatmentProtocolController],
  providers: [TreatmentProtocolService, TreatmentProtocolRepository, PrismaService],
  exports: [TreatmentProtocolService],
})
export class TreatmentProtocolModule {}
