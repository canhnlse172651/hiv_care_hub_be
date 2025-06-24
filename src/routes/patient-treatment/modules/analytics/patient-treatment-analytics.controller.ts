import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthType } from '../../../../shared/constants/auth.constant'
import { Role } from '../../../../shared/constants/role.constant'
import { Auth } from '../../../../shared/decorators/auth.decorator'
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator'
import { Roles } from '../../../../shared/decorators/roles.decorator'
import {
  ApiCompareProtocolVsCustomTreatments,
  ApiGetCustomMedicationStats,
  ApiGetDoctorWorkloadStats,
  ApiGetPatientTreatmentStats,
  ApiGetTreatmentComplianceStats,
  ApiGetTreatmentCostAnalysis,
} from '../../../../swagger/patient-treatment.swagger'
import { PatientTreatmentQueryDto } from '../../patient-treatment.dto'
import { PatientTreatmentAnalyticsService } from './patient-treatment-analytics.service'

@ApiBearerAuth()
@ApiTags('Patient Treatment - Analytics')
@Controller('patient-treatments/analytics')
@Auth([AuthType.Bearer])
export class PatientTreatmentAnalyticsController {
  constructor(private readonly patientTreatmentAnalyticsService: PatientTreatmentAnalyticsService) {}

  @Get('stats/patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetPatientTreatmentStats()
  async getPatientTreatmentStats(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
  ): Promise<{
    totalTreatments: number
    activeTreatments: number
    completedTreatments: number
    totalCost: number
    averageCostPerTreatment: number
    protocols: number
    doctors: number
  }> {
    // If user is a patient, they can only see their own stats
    if (user.role?.name === 'PATIENT' && Number(user.id) !== patientId) {
      throw new ForbiddenException('Patients can only access their own statistics')
    }
    return await this.patientTreatmentAnalyticsService.getPatientTreatmentStats(patientId)
  }

  @Get('stats/doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetDoctorWorkloadStats()
  async getDoctorWorkloadStats(@Param('doctorId', ParseIntPipe) doctorId: number): Promise<{
    totalTreatments: number
    activeTreatments: number
    uniquePatients: number
    totalRevenue: number
    averageTreatmentValue: number
    protocols: number
  }> {
    return await this.patientTreatmentAnalyticsService.getDoctorWorkloadStats(doctorId)
  }

  @Get('custom-medication-stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetCustomMedicationStats()
  async getCustomMedicationStats(): Promise<{
    totalTreatmentsWithCustomMeds: number
    percentage: number
    mostCommonCustomMeds: any[]
    averageCostIncrease: number
  }> {
    return await this.patientTreatmentAnalyticsService.getCustomMedicationStats()
  }

  @Get('protocol-comparison/:protocolId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiCompareProtocolVsCustomTreatments()
  async compareProtocolVsCustomTreatments(@Param('protocolId', ParseIntPipe) protocolId: number): Promise<{
    protocolId: number
    standardTreatments: number
    customizedTreatments: number
    averageCostDifference: number
    effectivenessComparison: Record<string, any>
  }> {
    return await this.patientTreatmentAnalyticsService.compareProtocolVsCustomTreatments(protocolId)
  }

  @Get('compliance/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiGetTreatmentComplianceStats()
  async getTreatmentComplianceStats(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
  ): Promise<{
    patientId: number
    averageCompliance: number
    completedTreatments: number
    missedAppointments: number
    adherenceScore: string
  }> {
    // If user is a patient, they can only see their own compliance stats
    if (user.role?.name === 'PATIENT' && Number(user.id) !== patientId) {
      throw new ForbiddenException('Patients can only access their own compliance statistics')
    }
    return await this.patientTreatmentAnalyticsService.getTreatmentComplianceStats(patientId)
  }

  @Get('cost-analysis')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentCostAnalysis()
  async getTreatmentCostAnalysis(@Query() query: PatientTreatmentQueryDto): Promise<{
    totalTreatments: number
    totalCost: number
    averageCost: number
    costByProtocol: Record<string, any>
    costByDoctor: Record<string, any>
    costTrends: any[]
  }> {
    const params = {
      patientId: query.patientId,
      doctorId: query.doctorId,
      protocolId: query.protocolId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    }
    return await this.patientTreatmentAnalyticsService.getTreatmentCostAnalysis(params)
  }

  @Post('calculate-cost')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Calculate treatment cost preview',
    description: 'Calculate estimated cost for a treatment before creating it. Useful for cost preview in frontend.',
  })
  calculateTreatmentCost(
    @Body()
    costData: {
      protocolId: number
      customMedications?: any
      startDate: string
      endDate?: string
    },
  ): {
    isValid: boolean
    calculatedTotal: number
    breakdown: {
      protocolCost: number
      customMedicationCost: number
      durationMultiplier: number
      durationInDays: number | null
    }
    warnings: string[]
  } {
    const startDate = new Date(costData.startDate)
    const endDate = costData.endDate ? new Date(costData.endDate) : undefined

    return this.patientTreatmentAnalyticsService.calculateTreatmentCost(
      costData.protocolId,
      costData.customMedications as Record<string, any> | undefined,
      startDate,
      endDate,
    )
  }

  @Get('general-stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Get general treatment statistics',
    description: 'Comprehensive overview statistics for all treatments including trends and top protocols.',
  })
  async getGeneralTreatmentStats(): Promise<{
    totalTreatments: number
    activeTreatments: number
    completedTreatments: number
    totalPatients: number
    averageTreatmentDuration: number | null
    totalCost: number
    averageCostPerTreatment: number
    topProtocols: Array<{
      protocolId: number
      count: number
      percentage: number
    }>
    monthlyTrends: Array<{
      month: string
      newTreatments: number
      completedTreatments: number
      totalCost: number
    }>
  }> {
    return await this.patientTreatmentAnalyticsService.getGeneralTreatmentStats()
  }
}
