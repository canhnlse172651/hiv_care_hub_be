import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PatientTreatment } from '@prisma/client'
import { AuthType } from '../../../../shared/constants/auth.constant'
import { Role } from '../../../../shared/constants/role.constant'
import { Auth } from '../../../../shared/decorators/auth.decorator'
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator'
import { Roles } from '../../../../shared/decorators/roles.decorator'
import { PaginatedResponse } from '../../../../shared/schemas/pagination.schema'
import {
  ApiBulkCreatePatientTreatments,
  ApiEndActivePatientTreatments,
  ApiGetTreatmentsWithCustomMedications,
} from '../../../../swagger/patient-treatment.swagger'
import { BulkCreatePatientTreatmentDto } from '../../patient-treatment.dto'
import { PatientTreatmentManagementService } from './patient-treatment-management.service'

@ApiBearerAuth()
@ApiTags('Patient Treatment - Management & Bulk Operations')
@Controller('patient-treatments/management')
@Auth([AuthType.Bearer])
export class PatientTreatmentManagementController {
  constructor(private readonly patientTreatmentManagementService: PatientTreatmentManagementService) {}

  @Post('bulk')
  @Roles(Role.Admin, Role.Doctor)
  @ApiBulkCreatePatientTreatments()
  async bulkCreatePatientTreatments(
    @Body() data: BulkCreatePatientTreatmentDto,
    @CurrentUser() user: any,
  ): Promise<PatientTreatment[]> {
    return await this.patientTreatmentManagementService.bulkCreatePatientTreatments(data, Number(user.id))
  }

  @Put('end-active/:patientId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiEndActivePatientTreatments()
  async endActivePatientTreatments(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: any,
  ): Promise<{
    success: boolean
    message: string
    deactivatedCount: number
    endDate: string
    activeTreatments: PatientTreatment[]
  }> {
    const result = await this.patientTreatmentManagementService.endActivePatientTreatments(patientId)

    // Log the action for audit purposes
    if (result.success && result.deactivatedCount > 0) {
      console.log(
        `User ${user.id || user.userId} ended ${result.deactivatedCount} active treatment(s) for patient ${patientId}`,
      )
    }

    return {
      success: result.success,
      message: result.message,
      deactivatedCount: result.deactivatedCount,
      endDate: result.endDate.toISOString(),
      activeTreatments: result.activeTreatments,
    }
  }

  @Get('custom-medications')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentsWithCustomMedications()
  async getTreatmentsWithCustomMedications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('hasCustomMeds') hasCustomMeds?: string,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    const query = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      hasCustomMeds: hasCustomMeds === 'true',
    }
    return this.patientTreatmentManagementService.findTreatmentsWithCustomMedications(query)
  }

  @Get('audit/business-rule-violations')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Detect business rule violations',
    description:
      'Audits all patients to find those with multiple active treatments, which violates the 1-patient-1-protocol rule.',
  })
  async detectBusinessRuleViolations(): Promise<{
    totalViolations: number
    violatingPatients: Array<{
      patientId: number
      activeTreatmentCount: number
      treatments: Array<{
        id: number
        protocolId: number
        startDate: string
        endDate: string | null
      }>
      protocols: number[]
    }>
  }> {
    return await this.patientTreatmentManagementService.detectBusinessRuleViolations()
  }

  @Post('audit/fix-business-rule-violations')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Fix business rule violations',
    description:
      'Automatically fixes business rule violations by ending older treatments. Use dryRun=true to preview actions.',
  })
  async fixBusinessRuleViolations(@Query('dryRun') dryRun?: string): Promise<{
    processedPatients: number
    treatmentsEnded: number
    errors: string[]
    actions: Array<{
      patientId: number
      action: 'end_treatment'
      treatmentId: number
      protocolId: number
      newEndDate: string
    }>
  }> {
    const isDryRun = dryRun !== 'false' // Default to true for safety
    return await this.patientTreatmentManagementService.fixBusinessRuleViolations(isDryRun)
  }

  @Get('test/business-rule-compliance/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Test comprehensive business rule compliance for a patient',
    description:
      'Runs a full suite of tests to validate business rule compliance for a specific patient, including edge cases and data integrity checks.',
  })
  async testBusinessRuleCompliance(@Param('patientId', ParseIntPipe) patientId: number): Promise<{
    passed: boolean
    tests: Array<{
      testName: string
      passed: boolean
      details: string
      severity: 'info' | 'warning' | 'error'
    }>
    overallStatus: 'compliant' | 'warning' | 'violation'
    summary: {
      activeCount: number
      protocolCount: number
      overlaps: number
      futureConflicts: number
    }
  }> {
    return await this.patientTreatmentManagementService.testBusinessRuleCompliance(patientId)
  }

  @Get('audit/data-integrity')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Run data integrity checks',
    description: 'Check for data inconsistencies, orphaned records, and other integrity issues.',
  })
  async runDataIntegrityChecks(): Promise<{
    totalChecks: number
    passedChecks: number
    failedChecks: number
    issues: Array<{
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      affectedRecords: number
      recommendedAction: string
    }>
    summary: {
      orphanedTreatments: number
      invalidDateRanges: number
      missingReferences: number
      duplicateRecords: number
    }
  }> {
    return await this.patientTreatmentManagementService.runDataIntegrityChecks()
  }

  @Post('maintenance/cleanup-orphaned')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Cleanup orphaned treatment records',
    description: 'Remove or fix treatment records that have invalid references.',
  })
  async cleanupOrphanedRecords(@Query('dryRun') dryRun?: string): Promise<{
    totalProcessed: number
    recordsFixed: number
    recordsDeleted: number
    errors: string[]
    actions: Array<{
      action: 'fix' | 'delete'
      recordId: number
      issue: string
      resolution: string
    }>
  }> {
    const isDryRun = dryRun !== 'false'
    return await this.patientTreatmentManagementService.cleanupOrphanedRecords(isDryRun)
  }

  @Get('export/treatments')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Export treatment data',
    description: 'Export treatment data in various formats for reporting and analysis.',
  })
  async exportTreatmentData(
    @Query('format') format?: 'csv' | 'excel' | 'json',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
  ): Promise<{
    format: string
    recordCount: number
    exportData: any
    generatedAt: string
    filters: any
  }> {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      patientId: patientId ? Number(patientId) : undefined,
      doctorId: doctorId ? Number(doctorId) : undefined,
    }

    return await this.patientTreatmentManagementService.exportTreatmentData(format || 'json', filters)
  }

  @Post('import/treatments')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Import treatment data',
    description: 'Import treatment data from external sources with validation.',
  })
  async importTreatmentData(
    @Body()
    importData: {
      format: 'csv' | 'excel' | 'json'
      data: any
      validationLevel: 'strict' | 'lenient'
      dryRun?: boolean
    },
    @CurrentUser() user: any,
  ): Promise<{
    totalRecords: number
    validRecords: number
    invalidRecords: number
    importedRecords: number
    errors: Array<{
      row: number
      field: string
      value: any
      error: string
    }>
    warnings: string[]
    summary: {
      newTreatments: number
      updatedTreatments: number
      skippedRecords: number
    }
  }> {
    return await this.patientTreatmentManagementService.importTreatmentData(importData, Number(user.id))
  }
}
