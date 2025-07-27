import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { PaymentConsumer } from 'src/queue/payment.consumer'
import { PAYMENT_QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PatientTreatmentModule } from '../patient-treatment/patient-treatment.module'
import { PaymentController } from './payment.controller'
import { PaymentRepo } from './payment.repo'
import { PaymentService } from './payment.service'
import { AppoinmentModule } from '../appoinment/appoinment.module'

@Module({
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_QUEUE_NAME,
    }),
    PatientTreatmentModule,
    AppoinmentModule,
  ],
  providers: [PaymentService, PaymentRepo, PaymentConsumer, PrismaService],
  controllers: [PaymentController],
})
export class PaymentModule {}
