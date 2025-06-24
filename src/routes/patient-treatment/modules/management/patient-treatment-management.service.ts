import { Injectable } from '@nestjs/common'
import { PatientTreatment, Prisma } from '@prisma/client'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'
import { PaginatedResponse } from '../../../../shared/schemas/pagination.schema'
import { BulkCreatePatientTreatmentSchema } from '../../patient-treatment.model'

@Injectable()
export class PatientTreatmentManagementService {
  constructor(private readonly patientTreatmentRepository: PatientTreatmentRepository) {}

  // Bulk create patient treatments
  async bulkCreatePatientTreatments(data: any, userId: number): Promise<PatientTreatment[]> {
    try {
      const validatedData = BulkCreatePatientTreatmentSchema.parse(data)
      const results: PatientTreatment[] = []

      for (const treatmentData of validatedData.items) {
        const createData = {
          ...treatmentData,
          createdById: userId,
          total: treatmentData.total || 0, // Ensure total is always a number
        }
        const treatment = await this.patientTreatmentRepository.createPatientTreatment(createData)
        results.push(treatment)
      }

      return results
    } catch (error) {
      console.error('Error bulk creating patient treatments:', error)
      throw error
    }
  }

  // End active patient treatments
  async endActivePatientTreatments(patientId: number): Promise<{
    success: boolean
    message: string
    deactivatedCount: number
    endDate: Date
    activeTreatments: PatientTreatment[]
  }> {
    try {
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })

      if (activeTreatments.length === 0) {
        return {
          success: true,
          message: 'No active treatments found for this patient',
          deactivatedCount: 0,
          endDate: new Date(),
          activeTreatments: [],
        }
      }

      const endDate = new Date()
      const updatedTreatments: PatientTreatment[] = []

      for (const treatment of activeTreatments) {
        const updated = await this.patientTreatmentRepository.updatePatientTreatment(treatment.id, {
          endDate: endDate,
        })
        updatedTreatments.push(updated)
      }

      return {
        success: true,
        message: `Successfully ended ${activeTreatments.length} active treatment(s)`,
        deactivatedCount: activeTreatments.length,
        endDate: endDate,
        activeTreatments: updatedTreatments,
      }
    } catch (error) {
      console.error('Error ending active patient treatments:', error)
      throw error
    }
  }

  // Find treatments with custom medications
  async findTreatmentsWithCustomMedications(query: any): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', hasCustomMeds = false } = query

      // Build where clause for custom medications
      const where: Prisma.PatientTreatmentWhereInput = {}
      if (hasCustomMeds) {
        where.customMedications = { not: {} } // Has any custom medications
      }

      const skip = (page - 1) * limit
      const [data, total] = await Promise.all([
        this.patientTreatmentRepository.findPatientTreatments({
          skip,
          take: limit,
          where,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.patientTreatmentRepository.countPatientTreatments(where),
      ])

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      }
    } catch (error) {
      console.error('Error finding treatments with custom medications:', error)
      throw error
    }
  }

  // Detect business rule violations
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
    try {
      // Get all active treatments grouped by patient
      const allActiveTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({})

      // Group by patient
      const patientTreatments = allActiveTreatments.reduce(
        (acc, treatment) => {
          if (!acc[treatment.patientId]) {
            acc[treatment.patientId] = []
          }
          acc[treatment.patientId].push(treatment)
          return acc
        },
        {} as Record<number, PatientTreatment[]>,
      )

      // Find violations (patients with multiple active treatments)
      const violatingPatients = Object.entries(patientTreatments)
        .filter(([_, treatments]) => treatments.length > 1)
        .map(([patientId, treatments]) => ({
          patientId: Number(patientId),
          activeTreatmentCount: treatments.length,
          treatments: treatments.map((t) => ({
            id: t.id,
            protocolId: t.protocolId,
            startDate: t.startDate.toISOString(),
            endDate: t.endDate?.toISOString() || null,
          })),
          protocols: [...new Set(treatments.map((t) => t.protocolId))],
        }))

      return {
        totalViolations: violatingPatients.length,
        violatingPatients,
      }
    } catch (error) {
      console.error('Error detecting business rule violations:', error)
      throw error
    }
  }

  // Fix business rule violations
  async fixBusinessRuleViolations(isDryRun: boolean = true): Promise<{
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
    try {
      const violations = await this.detectBusinessRuleViolations()
      const actions: any[] = []
      const errors: string[] = []
      let treatmentsEnded = 0

      for (const violation of violations.violatingPatients) {
        try {
          // Sort treatments by start date (keep the newest, end the older ones)
          const sortedTreatments = violation.treatments.sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
          )

          // End all but the newest treatment
          for (let i = 1; i < sortedTreatments.length; i++) {
            const treatment = sortedTreatments[i]
            const newEndDate = new Date()

            actions.push({
              patientId: violation.patientId,
              action: 'end_treatment' as const,
              treatmentId: treatment.id,
              protocolId: treatment.protocolId,
              newEndDate: newEndDate.toISOString(),
            })

            if (!isDryRun) {
              await this.patientTreatmentRepository.updatePatientTreatment(treatment.id, {
                endDate: newEndDate,
              })
            }

            treatmentsEnded++
          }
        } catch (error) {
          errors.push(`Failed to fix violations for patient ${violation.patientId}: ${error.message}`)
        }
      }

      return {
        processedPatients: violations.violatingPatients.length,
        treatmentsEnded,
        errors,
        actions,
      }
    } catch (error) {
      console.error('Error fixing business rule violations:', error)
      throw error
    }
  }

  // Test business rule compliance
  async testBusinessRuleCompliance(patientId: number): Promise<{
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
    try {
      const activeTreatments = await this.patientTreatmentRepository.getActivePatientTreatments({ patientId })
      const allTreatments = await this.patientTreatmentRepository.findPatientTreatmentsByPatientId(patientId, {
        skip: 0,
        take: 100,
      })

      const tests: any[] = []
      let overallStatus: 'compliant' | 'warning' | 'violation' = 'compliant'

      // Test 1: Single active treatment rule
      const singleActiveTest = {
        testName: 'Single Active Treatment Rule',
        passed: activeTreatments.length <= 1,
        details: `Patient has ${activeTreatments.length} active treatments (should be ≤ 1)`,
        severity: activeTreatments.length > 1 ? ('error' as const) : ('info' as const),
      }
      tests.push(singleActiveTest)
      if (!singleActiveTest.passed) overallStatus = 'violation'

      // Test 2: Future dates validation
      const futureTreatments = allTreatments.filter((t) => t.startDate > new Date())
      const futureDateTest = {
        testName: 'Future Start Dates',
        passed: futureTreatments.length === 0,
        details: `Found ${futureTreatments.length} treatments with future start dates`,
        severity: futureTreatments.length > 0 ? ('warning' as const) : ('info' as const),
      }
      tests.push(futureDateTest)
      if (!futureDateTest.passed && overallStatus === 'compliant') overallStatus = 'warning'

      // Test 3: Date range validation
      const invalidRanges = allTreatments.filter((t) => t.endDate && t.endDate < t.startDate)
      const dateRangeTest = {
        testName: 'Date Range Validation',
        passed: invalidRanges.length === 0,
        details: `Found ${invalidRanges.length} treatments with invalid date ranges`,
        severity: invalidRanges.length > 0 ? ('error' as const) : ('info' as const),
      }
      tests.push(dateRangeTest)
      if (!dateRangeTest.passed) overallStatus = 'violation'

      // Calculate summary
      const protocols = [...new Set(allTreatments.map((t) => t.protocolId))]
      const overlaps = activeTreatments.length > 1 ? activeTreatments.length - 1 : 0

      return {
        passed: overallStatus === 'compliant',
        tests,
        overallStatus,
        summary: {
          activeCount: activeTreatments.length,
          protocolCount: protocols.length,
          overlaps,
          futureConflicts: futureTreatments.length,
        },
      }
    } catch (error) {
      console.error('Error testing business rule compliance:', error)
      throw error
    }
  }

  // Run data integrity checks
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
    try {
      const issues: any[] = []
      let totalChecks = 0
      let passedChecks = 0

      // Check 1: Invalid date ranges
      totalChecks++
      const invalidDateRanges = await this.patientTreatmentRepository.findPatientTreatments({
        where: {
          AND: [
            { endDate: { not: null } },
            // Use raw query for complex date comparison
          ],
        },
      })

      // Additional check: manually filter treatments where endDate < startDate
      const invalidRangeFiltered = invalidDateRanges.filter((treatment) => {
        return treatment.endDate && treatment.endDate < treatment.startDate
      })

      if (invalidRangeFiltered.length === 0) {
        passedChecks++
      } else {
        issues.push({
          type: 'Invalid Date Ranges',
          severity: 'high' as const,
          description: `Found treatments where end date is before start date`,
          affectedRecords: invalidDateRanges.length,
          recommendedAction: 'Review and correct date ranges manually',
        })
      }

      // Check 2: Future start dates
      totalChecks++
      const futureTreatments = await this.patientTreatmentRepository.findPatientTreatments({
        where: {
          startDate: { gt: new Date() },
        },
      })

      if (futureTreatments.length === 0) {
        passedChecks++
      } else {
        issues.push({
          type: 'Future Start Dates',
          severity: 'medium' as const,
          description: `Found treatments scheduled for future dates`,
          affectedRecords: futureTreatments.length,
          recommendedAction: 'Verify if future scheduling is intentional',
        })
      }

      // Additional checks would go here...

      const failedChecks = totalChecks - passedChecks

      return {
        totalChecks,
        passedChecks,
        failedChecks,
        issues,
        summary: {
          orphanedTreatments: 0, // Would implement actual check
          invalidDateRanges: invalidDateRanges.length,
          missingReferences: 0, // Would implement actual check
          duplicateRecords: 0, // Would implement actual check
        },
      }
    } catch (error) {
      console.error('Error running data integrity checks:', error)
      throw error
    }
  }

  // Cleanup orphaned records
  cleanupOrphanedRecords(isDryRun: boolean = true): Promise<{
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
    try {
      // Mock implementation - would need actual orphan detection logic
      return Promise.resolve({
        totalProcessed: 0,
        recordsFixed: 0,
        recordsDeleted: 0,
        errors: [],
        actions: [],
      })
    } catch (error) {
      console.error('Error cleaning up orphaned records:', error)
      throw error
    }
  }

  // Export treatment data
  async exportTreatmentData(
    format: string,
    filters: any,
  ): Promise<{
    format: string
    recordCount: number
    exportData: any
    generatedAt: string
    filters: any
  }> {
    try {
      // Build where clause from filters
      const where: any = {}
      if (filters.patientId) where.patientId = filters.patientId
      if (filters.doctorId) where.doctorId = filters.doctorId
      if (filters.startDate || filters.endDate) {
        where.startDate = {}
        if (filters.startDate) where.startDate.gte = filters.startDate
        if (filters.endDate) where.startDate.lte = filters.endDate
      }

      const treatments = await this.patientTreatmentRepository.findPatientTreatments({
        where,
        take: 10000, // Limit for export
      })

      // Format data based on requested format
      let exportData: any
      switch (format) {
        case 'csv':
          exportData = this.formatAsCSV(treatments)
          break
        case 'excel':
          exportData = this.formatAsExcel(treatments)
          break
        default:
          exportData = treatments
      }

      return {
        format,
        recordCount: treatments.length,
        exportData,
        generatedAt: new Date().toISOString(),
        filters,
      }
    } catch (error) {
      console.error('Error exporting treatment data:', error)
      throw error
    }
  }

  // Import treatment data
  importTreatmentData(
    importData: any,
    userId: number,
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
    try {
      // Mock implementation - would need actual import logic
      return Promise.resolve({
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        importedRecords: 0,
        errors: [],
        warnings: [],
        summary: {
          newTreatments: 0,
          updatedTreatments: 0,
          skippedRecords: 0,
        },
      })
    } catch (error) {
      console.error('Error importing treatment data:', error)
      throw error
    }
  }

  // Helper methods for data formatting
  private formatAsCSV(treatments: PatientTreatment[]): string {
    // Mock CSV format
    const headers = ['ID', 'Patient ID', 'Protocol ID', 'Doctor ID', 'Start Date', 'End Date', 'Total']
    const rows = treatments.map((t) => [
      t.id,
      t.patientId,
      t.protocolId,
      t.doctorId,
      t.startDate.toISOString(),
      t.endDate?.toISOString() || '',
      t.total,
    ])

    return [headers, ...rows].map((row) => row.join(',')).join('\n')
  }

  private formatAsExcel(treatments: PatientTreatment[]): any {
    // Mock Excel format - would use a library like xlsx
    return {
      sheets: [
        {
          name: 'Treatments',
          data: treatments,
        },
      ],
    }
  }
}
