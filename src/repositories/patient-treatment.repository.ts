import { Injectable } from '@nestjs/common'
import { PatientTreatment, Prisma } from '@prisma/client'
import { PaginatedResponse } from 'src/shared/schemas/pagination.schema'
import { PaginationService } from 'src/shared/services/pagination.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { z } from 'zod'
import { FlexibleCustomMedicationsSchema } from '../routes/patient-treatment/patient-treatment.model'

// Use the same schema from model instead of defining a different one

export const CreatePatientTreatmentDataSchema = z.object({
  patientId: z.number().positive('Patient ID must be positive'),
  protocolId: z.number().positive('Protocol ID must be positive'),
  doctorId: z.number().positive('Doctor ID must be positive'),
  customMedications: FlexibleCustomMedicationsSchema,
  notes: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  createdById: z.number().positive('Created by ID must be positive'),
  total: z.number().min(0, 'Total must be non-negative'),
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

  /**
   * Validates and converts ID parameter to number
   * Supports both number and string input for flexibility
   * Uses shared validation logic from BaseRepository pattern
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
   *
   * @param data - Patient treatment creation data with validation
   * @returns Created patient treatment with full relations
   * @throws ValidationError if input data is invalid
   * @throws PrismaError if database operation fails
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
    // Validate input data
    const validatedData = CreatePatientTreatmentDataSchema.parse(data)

    // Serialize customMedications for Prisma JSON field
    const customMedicationsJson = validatedData.customMedications
      ? JSON.parse(JSON.stringify(validatedData.customMedications))
      : null

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
          total: validatedData.total,
        },
        include: {
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
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Find patient treatment by ID with optional custom includes
   * Returns null if treatment not found, includes comprehensive relations by default
   *
   * @param id - Treatment ID to search for
   * @param include - Optional custom include configuration
   * @returns Patient treatment with relations or null if not found
   * @throws ValidationError if ID is invalid
   */
  async findPatientTreatmentById(
    id: number,
    include?: Prisma.PatientTreatmentInclude,
  ): Promise<PatientTreatment | null> {
    const validatedId = this.validateId(id)

    try {
      return await this.prismaService.patientTreatment.findUnique({
        where: { id: validatedId },
        include: include || {
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
          testResults: true,
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Update patient treatment with validation
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

    // Serialize customMedications for Prisma JSON field if provided
    const updateData = {
      ...validatedData,
      ...(validatedData.customMedications !== undefined && {
        customMedications: validatedData.customMedications
          ? JSON.parse(JSON.stringify(validatedData.customMedications))
          : null,
      }),
    }

    try {
      return await this.prismaService.patientTreatment.update({
        where: { id: validatedId },
        data: updateData,
        include: {
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
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Delete patient treatment with validation
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

  // Find all patient treatments with filtering
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
      include: include || {
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
      },
    })
  }

  // Count patient treatments with filtering
  async countPatientTreatments(where?: Prisma.PatientTreatmentWhereInput): Promise<number> {
    return this.prismaService.patientTreatment.count({
      where,
    })
  }

  // Find patient treatments by patient ID
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
      include: {
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
      },
    })
  }

  // Count patient treatments by patient ID
  async countPatientTreatmentsByPatientId(patientId: number): Promise<number> {
    return this.prismaService.patientTreatment.count({
      where: { patientId },
    })
  }

  // Find patient treatments by doctor ID
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
      include: {
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  // Search patient treatments
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
        include: {
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Get treatments by date range
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
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          protocol: true,
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
        },
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
   *
   * @param params - Query parameters with optional pagination and ordering
   * @returns Array of active patient treatments with full relations
   */
  async getActivePatientTreatments(
    params: {
      skip?: number
      take?: number
      orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    } = {},
  ): Promise<PatientTreatment[]> {
    const { skip, take, orderBy } = params
    const currentDate = new Date()

    try {
      return await this.prismaService.patientTreatment.findMany({
        where: {
          OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
        },
        skip,
        take,
        orderBy: orderBy || { startDate: 'desc' },
        include: {
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
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get treatment statistics for a specific patient
   * Provides comprehensive analytics for patient treatment history
   *
   * @param patientId - Patient ID to get statistics for
   * @returns Treatment statistics including counts and totals
   */
  async getPatientTreatmentStats(patientId: number): Promise<{
    totalTreatments: number
    activeTreatments: number
    completedTreatments: number
    totalCost: number
    averageTreatmentDuration: number | null
  }> {
    const validatedPatientId = this.validateId(patientId)
    const currentDate = new Date()

    try {
      const [totalTreatments, activeTreatments, completedTreatments, treatmentData] = await Promise.all([
        // Total treatments count
        this.prismaService.patientTreatment.count({
          where: { patientId: validatedPatientId },
        }),
        // Active treatments count
        this.prismaService.patientTreatment.count({
          where: {
            patientId: validatedPatientId,
            OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
          },
        }),
        // Completed treatments count
        this.prismaService.patientTreatment.count({
          where: {
            patientId: validatedPatientId,
            endDate: { lte: currentDate },
          },
        }),
        // Get all treatment data for calculations
        this.prismaService.patientTreatment.findMany({
          where: { patientId: validatedPatientId },
          select: {
            total: true,
            startDate: true,
            endDate: true,
          },
        }),
      ])

      // Calculate total cost
      const totalCost = treatmentData.reduce((sum, treatment) => sum + treatment.total, 0)

      // Calculate average treatment duration (for completed treatments only)
      const completedTreatmentData = treatmentData.filter((t) => t.endDate && t.endDate <= currentDate)
      let averageTreatmentDuration: number | null = null

      if (completedTreatmentData.length > 0) {
        const totalDurationDays = completedTreatmentData.reduce((sum, treatment) => {
          if (treatment.endDate) {
            const durationMs = treatment.endDate.getTime() - treatment.startDate.getTime()
            return sum + durationMs / (1000 * 60 * 60 * 24) // Convert to days
          }
          return sum
        }, 0)
        averageTreatmentDuration = Math.round(totalDurationDays / completedTreatmentData.length)
      }

      return {
        totalTreatments,
        activeTreatments,
        completedTreatments,
        totalCost,
        averageTreatmentDuration,
      }
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get doctor workload statistics
   * Provides insights into doctor's current and historical treatment load
   *
   * @param doctorId - Doctor ID to get statistics for
   * @returns Doctor workload statistics
   */
  async getDoctorWorkloadStats(doctorId: number): Promise<{
    totalPatients: number
    activePatients: number
    totalTreatments: number
    activeTreatments: number
    averageTreatmentCost: number
  }> {
    const validatedDoctorId = this.validateId(doctorId)
    const currentDate = new Date()

    try {
      const [totalTreatments, activeTreatments, treatmentData, uniquePatients, activePatients] = await Promise.all([
        // Total treatments count
        this.prismaService.patientTreatment.count({
          where: { doctorId: validatedDoctorId },
        }),
        // Active treatments count
        this.prismaService.patientTreatment.count({
          where: {
            doctorId: validatedDoctorId,
            OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
          },
        }),
        // Get treatment data for calculations
        this.prismaService.patientTreatment.findMany({
          where: { doctorId: validatedDoctorId },
          select: {
            total: true,
            patientId: true,
            endDate: true,
          },
        }),
        // Count unique patients
        this.prismaService.patientTreatment.findMany({
          where: { doctorId: validatedDoctorId },
          select: { patientId: true },
          distinct: ['patientId'],
        }),
        // Count active unique patients
        this.prismaService.patientTreatment.findMany({
          where: {
            doctorId: validatedDoctorId,
            OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
          },
          select: { patientId: true },
          distinct: ['patientId'],
        }),
      ])

      // Calculate average treatment cost
      const totalCost = treatmentData.reduce((sum, treatment) => sum + treatment.total, 0)
      const averageTreatmentCost = totalTreatments > 0 ? totalCost / totalTreatments : 0

      return {
        totalPatients: uniquePatients.length,
        activePatients: activePatients.length,
        totalTreatments,
        activeTreatments,
        averageTreatmentCost: Math.round(averageTreatmentCost * 100) / 100, // Round to 2 decimal places
      }
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Bulk create patient treatments with validation
   * Efficiently creates multiple treatments in a single transaction
   *
   * @param treatmentsData - Array of treatment data to create
   * @returns Array of created patient treatments
   */
  async bulkCreatePatientTreatments(
    treatmentsData: Array<{
      patientId: number
      protocolId: number
      doctorId: number
      customMedications?: any
      notes?: string
      startDate: Date
      endDate?: Date
      createdById: number
      total: number
    }>,
  ): Promise<PatientTreatment[]> {
    // Validate all treatment data
    const validatedData = z.array(CreatePatientTreatmentDataSchema).parse(treatmentsData)

    try {
      return await this.prismaService.$transaction(
        validatedData.map((data) =>
          this.prismaService.patientTreatment.create({
            data: {
              patientId: data.patientId,
              protocolId: data.protocolId,
              doctorId: data.doctorId,
              customMedications: data.customMedications ? JSON.parse(JSON.stringify(data.customMedications)) : null,
              notes: data.notes,
              startDate: data.startDate,
              endDate: data.endDate,
              createdById: data.createdById,
              total: data.total,
            },
            include: {
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
            },
          }),
        ),
      )
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Find treatments with custom medications
   * Returns patient treatments that have additional custom medications beyond the protocol
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Patient treatments with custom medications
   */
  async findTreatmentsWithCustomMedications(
    params: {
      skip?: number
      take?: number
      patientId?: number
      doctorId?: number
      orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    } = {},
  ): Promise<PatientTreatment[]> {
    const { skip, take, patientId, doctorId, orderBy } = params

    try {
      const where: Prisma.PatientTreatmentWhereInput = {
        customMedications: { not: Prisma.DbNull },
      }

      if (patientId) {
        where.patientId = this.validateId(patientId)
      }

      if (doctorId) {
        where.doctorId = this.validateId(doctorId)
      }

      return await this.prismaService.patientTreatment.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
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
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get custom medication usage statistics
   * Provides insights into how often custom medications are used
   *
   * @returns Statistics about custom medication usage
   */
  async getCustomMedicationStats(): Promise<{
    totalTreatments: number
    treatmentsWithCustomMeds: number
    customMedicationUsageRate: number
    topCustomMedicines: Array<{
      medicineId: number
      medicineName: string
      usageCount: number
    }>
  }> {
    try {
      const [totalTreatments, treatmentsWithCustomMeds, treatmentsWithCustomMedications] = await Promise.all([
        // Total treatments count
        this.prismaService.patientTreatment.count(),
        // Treatments with custom medications count
        this.prismaService.patientTreatment.count({
          where: {
            customMedications: { not: Prisma.DbNull },
          },
        }),
        // Get all treatments with custom medications for analysis
        this.prismaService.patientTreatment.findMany({
          where: {
            customMedications: { not: Prisma.DbNull },
          },
          select: {
            customMedications: true,
          },
        }),
      ])

      // Calculate usage rate
      const customMedicationUsageRate = totalTreatments > 0 ? (treatmentsWithCustomMeds / totalTreatments) * 100 : 0

      // Analyze custom medications to find most used ones
      const medicineUsage = new Map<string, { medicineId: number; medicineName: string; count: number }>()

      treatmentsWithCustomMedications.forEach((treatment) => {
        if (treatment.customMedications) {
          try {
            const customMeds = treatment.customMedications as any[]
            customMeds.forEach((med) => {
              const key = `${med.medicineId}_${med.medicineName}`
              if (medicineUsage.has(key)) {
                medicineUsage.get(key)!.count++
              } else {
                medicineUsage.set(key, {
                  medicineId: med.medicineId,
                  medicineName: med.medicineName,
                  count: 1,
                })
              }
            })
          } catch (error) {
            console.warn('Error parsing custom medications:', error)
          }
        }
      })

      // Get top 10 most used custom medicines
      const topCustomMedicines = Array.from(medicineUsage.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          usageCount: item.count,
        }))

      return {
        totalTreatments,
        treatmentsWithCustomMeds,
        customMedicationUsageRate: Math.round(customMedicationUsageRate * 100) / 100,
        topCustomMedicines,
      }
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Compare protocol vs custom treatment outcomes
   * Analyzes whether custom modifications improve treatment effectiveness
   *
   * @param protocolId - Protocol ID to analyze
   * @returns Comparison between standard and custom treatments
   */
  async compareProtocolVsCustomTreatments(protocolId: number): Promise<{
    protocol: any
    standardTreatments: {
      count: number
      averageDuration: number | null
      averageCost: number
      completionRate: number
    }
    customTreatments: {
      count: number
      averageDuration: number | null
      averageCost: number
      completionRate: number
    }
    customizationRate: number
  }> {
    const validatedProtocolId = this.validateId(protocolId)
    const currentDate = new Date()

    try {
      const [protocol, standardTreatments, customTreatments] = await Promise.all([
        // Get protocol info
        this.prismaService.treatmentProtocol.findUnique({
          where: { id: validatedProtocolId },
          include: {
            medicines: {
              include: {
                medicine: true,
              },
            },
          },
        }),
        // Get standard treatments (without custom medications)
        this.prismaService.patientTreatment.findMany({
          where: {
            protocolId: validatedProtocolId,
            customMedications: { equals: Prisma.DbNull },
          },
          select: {
            startDate: true,
            endDate: true,
            total: true,
          },
        }),
        // Get custom treatments (with custom medications)
        this.prismaService.patientTreatment.findMany({
          where: {
            protocolId: validatedProtocolId,
            customMedications: { not: Prisma.DbNull },
          },
          select: {
            startDate: true,
            endDate: true,
            total: true,
          },
        }),
      ])

      if (!protocol) {
        throw new Error(`Treatment protocol with ID ${validatedProtocolId} not found`)
      }

      // Analyze standard treatments
      const standardStats = this.analyzeTreatmentGroup(standardTreatments, currentDate)
      const customStats = this.analyzeTreatmentGroup(customTreatments, currentDate)

      // Calculate customization rate
      const totalTreatments = standardTreatments.length + customTreatments.length
      const customizationRate = totalTreatments > 0 ? (customTreatments.length / totalTreatments) * 100 : 0

      return {
        protocol,
        standardTreatments: standardStats,
        customTreatments: customStats,
        customizationRate: Math.round(customizationRate * 100) / 100,
      }
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Helper method to analyze a group of treatments
   *
   * @param treatments - Array of treatment data
   * @param currentDate - Current date for calculations
   * @returns Analyzed statistics
   */
  private analyzeTreatmentGroup(
    treatments: Array<{ startDate: Date; endDate: Date | null; total: number }>,
    currentDate: Date,
  ) {
    const count = treatments.length
    const completedTreatments = treatments.filter((t) => t.endDate && t.endDate <= currentDate)

    // Calculate average duration for completed treatments
    let averageDuration: number | null = null
    if (completedTreatments.length > 0) {
      const totalDurationDays = completedTreatments.reduce((sum, treatment) => {
        if (treatment.endDate) {
          const durationMs = treatment.endDate.getTime() - treatment.startDate.getTime()
          return sum + durationMs / (1000 * 60 * 60 * 24)
        }
        return sum
      }, 0)
      averageDuration = Math.round(totalDurationDays / completedTreatments.length)
    }

    // Calculate average cost
    const totalCost = treatments.reduce((sum, treatment) => sum + treatment.total, 0)
    const averageCost = count > 0 ? totalCost / count : 0

    // Calculate completion rate
    const completionRate = count > 0 ? (completedTreatments.length / count) * 100 : 0

    return {
      count,
      averageDuration,
      averageCost: Math.round(averageCost * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
    }
  }

  /**
   * Enhanced error handling for database operations
   * Converts Prisma errors to application-specific errors with meaningful messages
   *
   * @param error - Raw error from database operation
   * @returns Processed Error with appropriate message and context
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

  /**
   * Find patient treatments with pagination using PaginationService
   * Provides paginated results with metadata for efficient data loading
   *
   * @param query - Query parameters including pagination, filtering, and search
   * @returns Paginated patient treatments with metadata
   */
  async findPatientTreatmentsPaginated(query: any): Promise<PaginatedResponse<any>> {
    try {
      // Parse pagination options
      const paginationOptions = this.paginationService.getPaginationOptions(query)

      // Build where condition
      const where: Prisma.PatientTreatmentWhereInput = {}

      // Add filters if provided with proper validation
      if (query.patientId) {
        const patientIdSchema = z.union([z.number(), z.string().transform(Number)])
        where.patientId = patientIdSchema.parse(query.patientId)
      }
      if (query.doctorId) {
        const doctorIdSchema = z.union([z.number(), z.string().transform(Number)])
        where.doctorId = doctorIdSchema.parse(query.doctorId)
      }
      if (query.protocolId) {
        const protocolIdSchema = z.union([z.number(), z.string().transform(Number)])
        where.protocolId = protocolIdSchema.parse(query.protocolId)
      }
      if (query.startDate && query.endDate) {
        const dateSchema = z.string().transform((str) => new Date(str))
        where.startDate = {
          gte: dateSchema.parse(query.startDate),
          lte: dateSchema.parse(query.endDate),
        }
      }

      // Add search conditions if search term is provided
      if (paginationOptions.search) {
        where.OR = [
          {
            notes: {
              contains: paginationOptions.search,
              mode: 'insensitive',
            },
          },
          {
            patient: {
              name: {
                contains: paginationOptions.search,
                mode: 'insensitive',
              },
            },
          },
          {
            doctor: {
              user: {
                name: {
                  contains: paginationOptions.search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ]
      }

      // Use PaginationService for paginated results
      return await this.paginationService.paginate(this.getPatientTreatmentModel(), paginationOptions, where, {
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
        testResults: true,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }
}
