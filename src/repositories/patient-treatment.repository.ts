import { Injectable } from '@nestjs/common'
import { PatientTreatment, Prisma } from '@prisma/client'
import { z } from 'zod'
import { CreatePatientTreatmentSchema } from '../routes/patient-treatment/patient-treatment.model'
import { PaginationService } from '../shared/services/pagination.service'
import { PrismaService } from '../shared/services/prisma.service'

// Constants
const DAYS_IN_MS = 1000 * 60 * 60 * 24

// Schema definitions
export const CreatePatientTreatmentDataSchema = CreatePatientTreatmentSchema.extend({
  createdById: z.number().positive('Created by ID must be positive'),
  total: z.number().min(0, 'Total must be non-negative').optional(),
})

export const UpdatePatientTreatmentDataSchema = CreatePatientTreatmentDataSchema.partial().omit({
  patientId: true,
  createdById: true,
})

@Injectable()
export class PatientTreatmentRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  // Include configurations for consistency
  private readonly defaultIncludes: Prisma.PatientTreatmentInclude = {
    patient: {
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
      },
    },
    protocol: {
      include: {
        medicines: {
          include: {
            medicine: true,
          },
        },
      },
    },
    doctor: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  }

  private readonly detailedIncludes: Prisma.PatientTreatmentInclude = {
    ...this.defaultIncludes,
    testResults: true,
  }

  /**
   * Validates and converts ID parameter to number
   * Supports both number and string input for flexibility
   *
   * @param id - ID to validate (number or string)
   * @returns Validated number ID
   * @throws ZodError if ID is invalid
   */
  protected validateId(id: number | string): number {
    const result = z.union([z.number().positive(), z.string().transform(Number)]).parse(id)
    return typeof result === 'string' ? parseInt(result, 10) : result
  }

  /**
   * Get Prisma model for pagination compatibility
   * Used by pagination services and utilities
   *
   * @returns Prisma PatientTreatment model delegate
   */
  getPatientTreatmentModel() {
    return this.prismaService.patientTreatment
  }

  /**
   * Create a new patient treatment record with comprehensive validation
   * Handles custom medications and establishes all necessary relationships
   */
  async createPatientTreatment(data: {
    patientId: number
    protocolId: number
    doctorId: number
    customMedications?: any
    notes?: string
    startDate: Date
    endDate?: Date
    createdById: number
    total: number
  }): Promise<PatientTreatment> {
    const validatedData = CreatePatientTreatmentDataSchema.parse(data)
    const customMedicationsJson = this.serializeCustomMedications(validatedData.customMedications)

    try {
      return await this.prismaService.patientTreatment.create({
        data: {
          patientId: validatedData.patientId,
          protocolId: validatedData.protocolId,
          doctorId: validatedData.doctorId,
          customMedications: customMedicationsJson,
          notes: validatedData.notes,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          createdById: validatedData.createdById,
          total: validatedData.total || 0,
        },
        include: this.defaultIncludes,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Find patient treatment by ID with optional custom includes
   * Returns null if treatment not found, includes comprehensive relations by default
   */
  async findPatientTreatmentById(
    id: number,
    include?: Prisma.PatientTreatmentInclude,
  ): Promise<PatientTreatment | null> {
    const validatedId = this.validateId(id)

    try {
      return await this.prismaService.patientTreatment.findUnique({
        where: { id: validatedId },
        include: include || this.detailedIncludes,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Update patient treatment with validation
   */
  async updatePatientTreatment(
    id: number,
    data: {
      protocolId?: number
      doctorId?: number
      customMedications?: any
      notes?: string
      startDate?: Date
      endDate?: Date
      total?: number
    },
  ): Promise<PatientTreatment> {
    const validatedId = this.validateId(id)
    const validatedData = UpdatePatientTreatmentDataSchema.parse(data)

    const updateData = {
      ...validatedData,
      ...(validatedData.customMedications !== undefined && {
        customMedications: this.serializeCustomMedications(validatedData.customMedications),
      }),
    }

    try {
      return await this.prismaService.patientTreatment.update({
        where: { id: validatedId },
        data: updateData,
        include: this.defaultIncludes,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Batch update multiple patient treatments for atomic operations
   * Used for bulk operations like ending active treatments
   */
  async batchUpdatePatientTreatments(
    treatmentIds: number[],
    data: {
      endDate?: Date
      notes?: string
      total?: number
    },
  ): Promise<{ count: number }> {
    // Validate all IDs
    const validatedIds = treatmentIds.map((id) => this.validateId(id))

    try {
      const result = await this.prismaService.patientTreatment.updateMany({
        where: {
          id: {
            in: validatedIds,
          },
        },
        data: {
          ...(data.endDate && { endDate: data.endDate }),
          ...(data.notes && { notes: data.notes }),
          ...(data.total !== undefined && { total: data.total }),
        },
      })

      return { count: result.count }
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Delete patient treatment with validation
   */
  async deletePatientTreatment(id: number): Promise<PatientTreatment> {
    const validatedId = this.validateId(id)

    try {
      return await this.prismaService.patientTreatment.delete({
        where: { id: validatedId },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Find all patient treatments with filtering
   */
  async findPatientTreatments(params: {
    skip?: number
    take?: number
    where?: Prisma.PatientTreatmentWhereInput
    orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    include?: Prisma.PatientTreatmentInclude
  }): Promise<PatientTreatment[]> {
    const { skip, take, where, orderBy, include } = params
    return this.prismaService.patientTreatment.findMany({
      skip,
      take,
      where,
      orderBy,
      include: include || this.defaultIncludes,
    })
  }

  /**
   * Count patient treatments with filtering
   */
  async countPatientTreatments(where?: Prisma.PatientTreatmentWhereInput): Promise<number> {
    return this.prismaService.patientTreatment.count({ where })
  }

  /**
   * Find patient treatments by patient ID
   */
  async findPatientTreatmentsByPatientId(
    patientId: number,
    params: {
      skip?: number
      take?: number
      orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    },
  ): Promise<PatientTreatment[]> {
    const { skip, take, orderBy } = params
    return this.prismaService.patientTreatment.findMany({
      where: { patientId },
      skip,
      take,
      orderBy,
      include: this.defaultIncludes,
    })
  }

  /**
   * Count patient treatments by patient ID
   */
  async countPatientTreatmentsByPatientId(patientId: number): Promise<number> {
    return this.prismaService.patientTreatment.count({ where: { patientId } })
  }

  /**
   * Find patient treatments by doctor ID
   */
  async findPatientTreatmentsByDoctorId(
    doctorId: number,
    params: {
      skip?: number
      take?: number
      orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    },
  ): Promise<PatientTreatment[]> {
    const { skip, take, orderBy } = params
    return this.prismaService.patientTreatment.findMany({
      where: { doctorId },
      skip,
      take,
      orderBy,
      include: this.defaultIncludes,
    })
  }

  /**
   * Search patient treatments
   */
  async searchPatientTreatments(query: string): Promise<PatientTreatment[]> {
    const searchSchema = z.string().min(1, 'Search query is required')
    const validatedQuery = searchSchema.parse(query)

    try {
      return await this.prismaService.patientTreatment.findMany({
        where: {
          OR: [
            {
              notes: {
                contains: validatedQuery,
                mode: 'insensitive',
              },
            },
            {
              patient: {
                name: {
                  contains: validatedQuery,
                  mode: 'insensitive',
                },
              },
            },
            {
              doctor: {
                user: {
                  name: {
                    contains: validatedQuery,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        },
        include: this.defaultIncludes,
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get treatments by date range
   */
  async getPatientTreatmentsByDateRange(startDate: Date, endDate: Date): Promise<PatientTreatment[]> {
    const dateRangeSchema = z
      .object({
        startDate: z.date(),
        endDate: z.date(),
      })
      .refine((data) => data.endDate >= data.startDate, {
        message: 'End date must be after start date',
      })

    const { startDate: validStartDate, endDate: validEndDate } = dateRangeSchema.parse({
      startDate,
      endDate,
    })

    try {
      return await this.prismaService.patientTreatment.findMany({
        where: {
          startDate: {
            gte: validStartDate,
            lte: validEndDate,
          },
        },
        include: this.defaultIncludes,
        orderBy: {
          startDate: 'desc',
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get active patient treatments (not yet ended)
   * Returns treatments where endDate is null or in the future
   * Can optionally filter by specific patient ID
   */
  async getActivePatientTreatments(
    params: {
      patientId?: number
      skip?: number
      take?: number
      orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    } = {},
  ): Promise<PatientTreatment[]> {
    const { patientId, skip, take, orderBy } = params
    const currentDate = new Date()

    try {
      const where: Prisma.PatientTreatmentWhereInput = {
        OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
      }

      // Add patient filter if patientId is provided
      if (patientId) {
        where.patientId = this.validateId(patientId)
      }

      return await this.prismaService.patientTreatment.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { startDate: 'desc' },
        include: this.defaultIncludes,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get active patient treatments by patient ID with additional status information
   * Provides enhanced information about current treatments including timing status
   */
  async getActivePatientTreatmentsByPatientId(
    patientId: number,
    includeHistory: boolean = false,
  ): Promise<
    Array<
      PatientTreatment & {
        isCurrent: boolean
        isStarted: boolean
        daysRemaining: number | null
        treatmentStatus: 'upcoming' | 'active' | 'ending_soon'
      }
    >
  > {
    const validatedPatientId = this.validateId(patientId)
    const currentDate = new Date()

    try {
      const where: Prisma.PatientTreatmentWhereInput = {
        patientId: validatedPatientId,
        OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
      }

      if (includeHistory) {
        const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * DAYS_IN_MS)
        where.OR!.push({ endDate: { gte: thirtyDaysAgo, lte: currentDate } })
      }

      const treatments = await this.prismaService.patientTreatment.findMany({
        where,
        orderBy: { startDate: 'desc' },
        include: this.detailedIncludes,
      })

      return treatments.map((treatment) => {
        const startDate = new Date(treatment.startDate)
        const endDate = treatment.endDate ? new Date(treatment.endDate) : null
        const isStarted = startDate <= currentDate
        const isCurrent = isStarted && (!endDate || endDate > currentDate)

        let daysRemaining: number | null = null
        if (endDate) {
          const diffTime = endDate.getTime() - currentDate.getTime()
          daysRemaining = Math.ceil(diffTime / DAYS_IN_MS)
        }

        let treatmentStatus: 'upcoming' | 'active' | 'ending_soon'
        if (!isStarted) {
          treatmentStatus = 'upcoming'
        } else if (daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0) {
          treatmentStatus = 'ending_soon'
        } else {
          treatmentStatus = 'active'
        }

        return {
          ...treatment,
          isCurrent,
          isStarted,
          daysRemaining,
          treatmentStatus,
        }
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get comprehensive active treatment summary
   * Combines general statistics with patient-specific details if patientId is provided
   */
  async getActivePatientTreatmentsSummary(patientId?: number): Promise<{
    totalActiveTreatments: number
    treatmentsByStatus: {
      upcoming: number
      active: number
      ending_soon: number
    }
    recentTreatments: PatientTreatment[]
    patientSpecific?: {
      patientId: number
      activeTreatments: Array<PatientTreatment & { isCurrent: boolean; daysRemaining: number | null }>
      hasActiveTreatment: boolean
      nextUpcoming: PatientTreatment | null
    }
  }> {
    const currentDate = new Date()

    try {
      // Get basic statistics
      const [totalActiveTreatments, recentTreatments] = await Promise.all([
        this.prismaService.patientTreatment.count({
          where: {
            OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
            ...(patientId && { patientId: this.validateId(patientId) }),
          },
        }),
        this.prismaService.patientTreatment.findMany({
          where: {
            OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
            ...(patientId && { patientId: this.validateId(patientId) }),
          },
          take: 5,
          orderBy: { startDate: 'desc' },
          include: this.defaultIncludes,
        }),
      ])

      // Get status breakdown
      const allActiveTreatments = await this.prismaService.patientTreatment.findMany({
        where: {
          OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
          ...(patientId && { patientId: this.validateId(patientId) }),
        },
        select: {
          startDate: true,
          endDate: true,
        },
      })

      const treatmentsByStatus = allActiveTreatments.reduce(
        (acc, treatment) => {
          const startDate = new Date(treatment.startDate)
          const endDate = treatment.endDate ? new Date(treatment.endDate) : null
          const isStarted = startDate <= currentDate

          if (!isStarted) {
            acc.upcoming++
          } else if (endDate) {
            const daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / DAYS_IN_MS)
            if (daysRemaining <= 7 && daysRemaining > 0) {
              acc.ending_soon++
            } else {
              acc.active++
            }
          } else {
            acc.active++
          }

          return acc
        },
        { upcoming: 0, active: 0, ending_soon: 0 },
      )

      const result = {
        totalActiveTreatments,
        treatmentsByStatus,
        recentTreatments,
      }

      // Add patient-specific information if patientId is provided
      if (patientId) {
        const patientActiveTreatments = await this.getActivePatientTreatmentsByPatientId(patientId)
        const hasActiveTreatment = patientActiveTreatments.some((t) => t.isCurrent)
        const nextUpcoming = patientActiveTreatments.find((t) => t.treatmentStatus === 'upcoming') || null

        return {
          ...result,
          patientSpecific: {
            patientId: this.validateId(patientId),
            activeTreatments: patientActiveTreatments,
            hasActiveTreatment,
            nextUpcoming,
          },
        }
      }

      return result
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Helper methods
  private serializeCustomMedications(customMedications?: any): any {
    return customMedications ? JSON.parse(JSON.stringify(customMedications)) : null
  }

  private calculateDurationInDays(startDate: Date, endDate: Date | null): number | null {
    if (!endDate) return null
    const durationMs = endDate.getTime() - startDate.getTime()
    return Math.round(durationMs / DAYS_IN_MS)
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100
  }

  /**
   * Enhanced error handling for database operations
   * Converts Prisma errors to application-specific errors with meaningful messages
   */
  private handlePrismaError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'unknown field'
          return new Error(`Unique constraint violation on field(s): ${target}`)
        }
        case 'P2025': {
          return new Error('Patient treatment record not found')
        }
        case 'P2003': {
          return new Error('Foreign key constraint violation - referenced record does not exist')
        }
        case 'P2011': {
          return new Error('Null constraint violation')
        }
        case 'P2012': {
          return new Error('Missing required value')
        }
        default: {
          return new Error(`Database operation failed: ${error.message}`)
        }
      }
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return new Error('Unknown database error occurred')
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return new Error('Database engine error occurred')
    }

    if (error instanceof Error) {
      return error
    }

    return new Error('An unknown error occurred during patient treatment operation')
  }
}
