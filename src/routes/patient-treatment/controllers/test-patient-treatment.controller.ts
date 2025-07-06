import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { PatientTreatmentService } from '../patient-treatment.service'

@ApiTags('Patient Treatment Test')
@Controller('test/patient-treatment')
export class TestPatientTreatmentController {
  constructor(private readonly patientTreatmentService: PatientTreatmentService) {}

  @Post('create-with-followup')
  @ApiOperation({ summary: 'Test creating patient treatment with follow-up appointment (No Auth)' })
  async testCreateWithFollowUp(
    @Body()
    data: {
      patientId: number
      protocolId: number
      doctorId: number
      startDate: string
      endDate?: string
      notes?: string
    },
  ) {
    // Mock user ID for testing
    const mockUserId = 1

    // Transform data to match the expected schema
    const treatmentData = {
      patientId: data.patientId,
      protocolId: data.protocolId,
      doctorId: data.doctorId,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      notes: data.notes,
      customMedications: {},
    }

    try {
      // Create patient treatment with follow-up
      const result = await this.patientTreatmentService.createPatientTreatment(treatmentData, mockUserId, false)

      return {
        success: true,
        message: 'Patient treatment created successfully with follow-up appointment',
        data: result,
        integration_info: {
          follow_up_appointment: 'Should be automatically created for this treatment',
          check_endpoint: '/patient-treatments/follow-up-appointments/patient/' + data.patientId,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error,
        debug: {
          attempted_data: treatmentData,
          suggestion: 'Check if patientId, protocolId, and doctorId exist in database',
        },
      }
    }
  }

  @Post('create-test-data')
  @ApiOperation({ summary: 'Create test data for patient treatment demo' })
  createTestData() {
    try {
      // This would be a simplified version - in real scenario you'd need proper patient/protocol creation
      return {
        success: true,
        message: 'Use existing data for testing',
        available_doctors: [1, 2, 3],
        suggested_test_request: {
          url: '/test/patient-treatment/create-with-followup',
          method: 'POST',
          body: {
            patientId: 1, // May need to be created first
            protocolId: 1, // May need to be created first
            doctorId: 1, // Available
            startDate: '2025-06-23T00:00:00.000Z',
            endDate: '2025-09-23T00:00:00.000Z',
            notes: 'Test treatment with follow-up appointment integration',
          },
        },
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error,
      }
    }
  }
}
