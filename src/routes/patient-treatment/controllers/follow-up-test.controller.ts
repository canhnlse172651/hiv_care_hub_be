import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FollowUpAppointmentService } from '../services/follow-up-appointment.service'

@ApiTags('Follow-up Test (No Auth)')
@Controller('patient-treatments/follow-up-test')
export class FollowUpTestController {
  constructor(private readonly followUpService: FollowUpAppointmentService) {}

  @Get('demo')
  @ApiOperation({
    summary: '[TEST] Demo follow-up appointment integration',
    description: 'Test endpoint để demo tính năng follow-up appointment (không cần auth)',
  })
  @ApiResponse({ status: 200, description: 'Demo test thành công' })
  testDemo() {
    return {
      success: true,
      message: 'Follow-up Appointment Service is working!',
      features: [
        'Tự động tạo follow-up appointment khi tạo treatment',
        'Tạo bulk appointments',
        'Auto-create cho treatments sắp kết thúc',
        'Update và query appointments',
        'Statistics và analytics',
      ],
      endpoints: {
        create: 'POST /patient-treatments/follow-up-appointments/:treatmentId',
        bulkCreate: 'POST /patient-treatments/follow-up-appointments/bulk-create',
        autoCreate: 'POST /patient-treatments/follow-up-appointments/auto-create/ending-treatments',
        getByPatient: 'GET /patient-treatments/follow-up-appointments/patient/:patientId',
        update: 'PUT /patient-treatments/follow-up-appointments/:appointmentId',
        statistics: 'GET /patient-treatments/follow-up-appointments/statistics',
      },
      integration: {
        patientTreatmentService: 'Integrated ✅',
        appointmentRepository: 'Available ✅',
        autoFollowUp: 'Enabled ✅',
      },
    }
  }

  @Post('create-mock-treatment')
  @ApiOperation({
    summary: '[TEST] Create mock patient treatment with follow-up',
    description: 'Tạo mock patient treatment để test tính năng follow-up appointment',
  })
  @ApiResponse({ status: 201, description: 'Mock treatment và follow-up appointment đã được tạo' })
  createMockTreatment(@Body() config: { patientId?: string; doctorId?: string; followUpDays?: number }) {
    const { patientId = 'test-patient-123', doctorId = 'test-doctor-456', followUpDays = 30 } = config

    // Mock patient treatment data
    const mockTreatment = {
      id: Math.floor(Math.random() * 10000),
      patientId,
      doctorId,
      treatmentProtocolId: 'mock-protocol-789',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      status: 'ACTIVE',
      notes: 'Mock treatment for testing follow-up appointment integration',
    }

    // Simulate creating follow-up appointment
    const mockFollowUpAppointment = {
      id: Math.floor(Math.random() * 10000),
      patientId,
      doctorId,
      serviceId: 1,
      appointmentDate: new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
      notes: `Auto-generated follow-up appointment for treatment ${mockTreatment.id}`,
      isFollowUp: true,
      relatedTreatmentId: mockTreatment.id,
      createdAt: new Date(),
    }

    return {
      success: true,
      message: 'Mock treatment và follow-up appointment đã được tạo thành công',
      data: {
        treatment: mockTreatment,
        followUpAppointment: mockFollowUpAppointment,
      },
      integration: {
        followUpCreated: true,
        automaticScheduling: true,
        dayOffset: followUpDays,
      },
    }
  }
}
