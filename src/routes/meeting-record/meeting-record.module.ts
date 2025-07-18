import { Module } from "@nestjs/common";
import { MeetingRecordController } from "./meeting-record.controller";
import { MeetingRecordService } from "./meeting-record.service";
import { MeetingRecordRepository } from "../../repositories/meeting-record.repository";
import { PrismaService } from "../../shared/services/prisma.service";
import { AppoinmentRepository } from "src/repositories/appoinment.repository";

@Module({
  controllers: [MeetingRecordController],
  providers: [MeetingRecordService, MeetingRecordRepository, PrismaService, AppoinmentRepository],
  exports: [MeetingRecordService],
})
export class MeetingRecordModule {}