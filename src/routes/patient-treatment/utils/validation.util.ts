import { BadRequestException, ConflictException } from '@nestjs/common'

export interface PatientTreatmentValidationData {
  patientId: number
  doctorId: number
  protocolId: number
  startDate: string | Date
  endDate?: string | Date
  notes?: string
  total?: number
  customMedications?: any
}

export class PatientTreatmentValidator {
  /**
   * Validate that required fields are present and have valid values
   */
  static validateRequiredFields(data: any): void {
    if (!data) {
      throw new BadRequestException('Treatment data is required')
    }

    const requiredFields = [
      { field: 'patientId', message: 'Patient ID is required' },
      { field: 'doctorId', message: 'Doctor ID is required' },
      { field: 'protocolId', message: 'Protocol ID is required' },
      { field: 'startDate', message: 'Start date is required' },
    ]

    for (const { field, message } of requiredFields) {
      if (!data[field]) {
        throw new BadRequestException(message)
      }
    }
  }

  /**
   * Validate ID fields are positive integers
   */
  static validateIds(data: PatientTreatmentValidationData): void {
    const idFields = [
      { field: 'patientId', value: data.patientId },
      { field: 'doctorId', value: data.doctorId },
      { field: 'protocolId', value: data.protocolId },
    ]

    for (const { field, value } of idFields) {
      const numValue = Number(value)
      if (isNaN(numValue) || numValue <= 0 || !Number.isInteger(numValue)) {
        throw new BadRequestException(`${field} must be a positive integer`)
      }
    }
  }

  /**
   * Validate date fields and their logical relationships
   */
  static validateDates(data: PatientTreatmentValidationData): void {
    const startDate = new Date(data.startDate)

    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid start date format')
    }

    // Check if start date is not too far in the past (more than 1 year)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    if (startDate < oneYearAgo) {
      throw new BadRequestException('Start date cannot be more than 1 year in the past')
    }

    // Check if start date is not too far in the future (more than 1 month)
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

    if (startDate > oneMonthFromNow) {
      throw new BadRequestException('Start date cannot be more than 1 month in the future')
    }

    // Validate end date if provided
    if (data.endDate) {
      const endDate = new Date(data.endDate)

      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date format')
      }

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date')
      }

      // Check if treatment duration is reasonable (not more than 2 years)
      const twoYearsFromStart = new Date(startDate)
      twoYearsFromStart.setFullYear(twoYearsFromStart.getFullYear() + 2)

      if (endDate > twoYearsFromStart) {
        throw new BadRequestException('Treatment duration cannot exceed 2 years')
      }
    }
  }

  /**
   * Validate total cost
   */
  static validateTotal(total?: number): void {
    if (total !== undefined && total !== null) {
      const numTotal = Number(total)
      if (isNaN(numTotal) || numTotal < 0) {
        throw new BadRequestException('Total cost must be a non-negative number')
      }

      // Check for reasonable upper limit (adjust as needed)
      if (numTotal > 1000000) {
        throw new BadRequestException('Total cost seems unreasonably high')
      }
    }
  }

  /**
   * Validate custom medications format
   */
  static validateCustomMedications(customMedications?: any): void {
    if (customMedications !== undefined && customMedications !== null) {
      // If it's a string, try to parse it as JSON
      if (typeof customMedications === 'string') {
        try {
          JSON.parse(customMedications)
        } catch (error) {
          throw new BadRequestException('Custom medications must be valid JSON format')
        }
      }

      // If it's an object, validate its structure
      if (typeof customMedications === 'object') {
        // Add specific validation rules for custom medications structure here
        // For example, check if it has required fields, proper format, etc.
      }
    }
  }

  /**
   * Validate notes field
   */
  static validateNotes(notes?: string): void {
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        throw new BadRequestException('Notes must be a string')
      }

      if (notes.length > 2000) {
        throw new BadRequestException('Notes cannot exceed 2000 characters')
      }
    }
  }

  /**
   * Business rule: Check if patient can have a new treatment
   */
  static validatePatientEligibility(patientId: number, activetreatments: any[]): void {
    // Check if patient has too many active treatments
    const maxActiveTransmissions = 3 // Configurable business rule

    if (activetreatments.length >= maxActiveTransmissions) {
      throw new ConflictException(
        `Patient cannot have more than ${maxActiveTransmissions} active treatments simultaneously`,
      )
    }
  }

  /**
   * Business rule: Validate treatment overlap
   */
  static validateTreatmentOverlap(
    newStartDate: Date,
    newEndDate: Date | undefined,
    existingTreatments: Array<{ id: number; startDate: Date; endDate?: Date }>,
  ): void {
    for (const existing of existingTreatments) {
      const existingStart = new Date(existing.startDate)
      const existingEnd = existing.endDate ? new Date(existing.endDate) : null

      // Check for overlap
      const hasOverlap = this.datesOverlap(newStartDate, newEndDate, existingStart, existingEnd)

      if (hasOverlap) {
        throw new ConflictException(
          `New treatment overlaps with existing treatment (ID: ${existing.id}). ` +
            'End the existing treatment or adjust dates to avoid overlap.',
        )
      }
    }
  }

  /**
   * Helper method to check if two date ranges overlap
   */
  private static datesOverlap(
    start1: Date,
    end1: Date | null | undefined,
    start2: Date,
    end2: Date | null | undefined,
  ): boolean {
    // If either range has no end date, treat it as ongoing
    const actualEnd1 = end1 || new Date('2099-12-31')
    const actualEnd2 = end2 || new Date('2099-12-31')

    // Check if ranges overlap
    return start1 <= actualEnd2 && start2 <= actualEnd1
  }

  /**
   * Comprehensive validation for patient treatment data
   */
  static validateAll(data: PatientTreatmentValidationData): void {
    this.validateRequiredFields(data)
    this.validateIds(data)
    this.validateDates(data)
    this.validateTotal(data.total)
    this.validateCustomMedications(data.customMedications)
    this.validateNotes(data.notes)
  }
}
