import { Injectable } from '@nestjs/common'
import { PatientTreatment } from '@prisma/client'
import { PrismaService } from '../shared/services/prisma.service'
import {
  CreatePatientTreatmentData,
  CustomMedicationsData,
  DoctorTreatmentStats,
  PatientTreatmentStats,
  PatientTreatmentWithDetails,
  TreatmentAdherenceReport,
  TreatmentFilters,
  TreatmentWhereInput,
  UpdatePatientTreatmentData,
} from '../shared/types'
import { BaseRepository, PaginationOptions, PaginationResult } from './base.repository'

@Injectable()
export class PatientTreatmentRepository extends BaseRepository<
  PatientTreatment,
  CreatePatientTreatmentData,
  UpdatePatientTreatmentData
> {
  protected model = this.prisma.patientTreatment
  protected searchFields = ['notes']

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  /**
   * Helper method to convert Decimal to number safely
   */
  private convertDecimalToNumber(value: any): number {
    if (typeof value === 'number') return value
    if (value && typeof value.toNumber === 'function') return Number(value.toNumber())
    return 0
  }

  /**
   * Override default includes
   */
  protected getDefaultInclude() {
    return {
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
      testResults: {
        select: {
          id: true,
          name: true,
          type: true,
          result: true,
          resultDate: true,
        },
        orderBy: {
          resultDate: 'desc',
        },
      },
    }
  }

  /**
   * Create patient treatment with validation
   */
  async createPatientTreatment(data: CreatePatientTreatmentData, userId: number): Promise<PatientTreatmentWithDetails> {
    return await this.transaction(async (tx) => {
      // Validate that patient, protocol, and doctor exist
      const [patient, protocol, doctor] = await Promise.all([
        tx.user.findUnique({ where: { id: data.patientId } }),
        tx.treatmentProtocol.findUnique({ where: { id: data.protocolId } }),
        tx.doctor.findUnique({ where: { id: data.doctorId } }),
      ])

      if (!patient) throw new Error('Patient not found')
      if (!protocol) throw new Error('Treatment protocol not found')
      if (!doctor) throw new Error('Doctor not found')

      // Create the treatment
      const treatment = await tx.patientTreatment.create({
        data: {
          ...data,
          createdById: userId,
        },
        include: this.getDefaultInclude(),
      })

      return treatment as PatientTreatmentWithDetails
    })
  }

  /**
   * Find active treatments for a patient
   */
  async findActiveByPatient(patientId: number): Promise<PatientTreatmentWithDetails[]> {
    return (await this.findMany({
      patientId,
      endDate: null,
    })) as PatientTreatmentWithDetails[]
  }

  /**
   * Find treatments by doctor
   */
  async findByDoctor(doctorId: number): Promise<PatientTreatmentWithDetails[]> {
    return (await this.findMany({ doctorId })) as PatientTreatmentWithDetails[]
  }

  /**
   * Find treatments by protocol
   */
  async findByProtocol(protocolId: number): Promise<PatientTreatmentWithDetails[]> {
    return (await this.findMany({ protocolId })) as PatientTreatmentWithDetails[]
  }

  /**
   * Complete a treatment (set end date)
   */
  async completeTreatment(treatmentId: number, userId: number): Promise<PatientTreatmentWithDetails> {
    return (await this.update(
      treatmentId,
      {
        endDate: new Date(),
      },
      userId,
    )) as PatientTreatmentWithDetails
  }

  /**
   * Get treatment with full details
   */
  async getTreatmentWithDetails(treatmentId: number): Promise<PatientTreatmentWithDetails | null> {
    return (await this.model.findUnique({
      where: { id: treatmentId },
      include: {
        ...this.getDefaultInclude(),
        testResults: {
          orderBy: {
            resultDate: 'desc',
          },
        },
      },
    })) as PatientTreatmentWithDetails | null
  }

  /**
   * Get patient treatment with detailed medication information
   */
  async getPatientTreatmentWithMedications(treatmentId: number): Promise<PatientTreatmentWithDetails | null> {
    return (await this.model.findUnique({
      where: { id: treatmentId },
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
                medicine: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    unit: true,
                    dose: true,
                    price: true,
                  },
                },
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
        testResults: {
          select: {
            id: true,
            name: true,
            type: true,
            result: true,
            resultDate: true,
          },
          orderBy: {
            resultDate: 'desc',
          },
        },
      },
    })) as PatientTreatmentWithDetails | null
  }

  /**
   * Find treatments with advanced filtering
   */
  async findWithAdvancedFiltering(
    options: PaginationOptions,
    filters: TreatmentFilters = {},
  ): Promise<PaginationResult<PatientTreatment>> {
    const additionalWhere: TreatmentWhereInput = {}

    // Patient filtering
    if (filters.patientId) {
      additionalWhere.patientId = filters.patientId
    }

    // Doctor filtering
    if (filters.doctorId) {
      additionalWhere.doctorId = filters.doctorId
    }

    // Protocol filtering
    if (filters.protocolId) {
      additionalWhere.protocolId = filters.protocolId
    }

    // Active/inactive filtering
    if (filters.isActive !== undefined) {
      if (filters.isActive) {
        additionalWhere.endDate = null
      } else {
        additionalWhere.endDate = { not: null }
      }
    }

    // Date range filtering
    if (filters.startDateFrom || filters.startDateTo) {
      additionalWhere.startDate = {}
      if (filters.startDateFrom) {
        additionalWhere.startDate.gte = filters.startDateFrom
      }
      if (filters.startDateTo) {
        additionalWhere.startDate.lte = filters.startDateTo
      }
    }

    return await this.findWithPagination(options, additionalWhere)
  }

  /**
   * Get treatment statistics for a patient
   */
  async getPatientTreatmentStats(patientId: number): Promise<PatientTreatmentStats> {
    const treatments = await this.findMany({ patientId })

    const stats: PatientTreatmentStats = {
      totalTreatments: treatments.length,
      activeTreatments: treatments.filter((t) => !t.endDate).length,
      completedTreatments: treatments.filter((t) => t.endDate).length,
      totalCost: treatments.reduce((sum, t) => sum + this.convertDecimalToNumber(t.total), 0),
      averageDuration: 0,
      mostUsedProtocols: [],
    }

    // Calculate average duration for completed treatments
    const completedWithDuration = treatments
      .filter((t) => t.endDate)
      .map((t) => ({
        ...t,
        duration: Math.ceil((t.endDate!.getTime() - t.startDate.getTime()) / (1000 * 60 * 60 * 24)),
      }))

    if (completedWithDuration.length > 0) {
      stats.averageDuration = Math.round(
        completedWithDuration.reduce((sum, t) => sum + t.duration, 0) / completedWithDuration.length,
      )
    }

    return stats
  }

  /**
   * Get doctor's treatment statistics
   */
  async getDoctorTreatmentStats(doctorId: number): Promise<DoctorTreatmentStats> {
    const treatments = await this.findMany({ doctorId })

    const totalRevenue = treatments.reduce((sum, t) => sum + this.convertDecimalToNumber(t.total), 0)

    return {
      totalTreatments: treatments.length,
      activeTreatments: treatments.filter((t) => !t.endDate).length,
      completedTreatments: treatments.filter((t) => t.endDate).length,
      totalRevenue,
      uniquePatients: new Set(treatments.map((t) => t.patientId)).size,
      averageTreatmentCost: treatments.length > 0 ? totalRevenue / treatments.length : 0,
    }
  }

  /**
   * Update treatment medications (custom medications)
   */
  async updateTreatmentMedications(
    treatmentId: number,
    customMedications: CustomMedicationsData,
    userId: number,
  ): Promise<PatientTreatmentWithDetails> {
    return (await this.update(
      treatmentId,
      {
        customMedications,
      },
      userId,
    )) as PatientTreatmentWithDetails
  }

  /**
   * Get treatments expiring soon (within specified days)
   */
  async getTreatmentsExpiringSoon(days = 7): Promise<PatientTreatmentWithDetails[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return (await this.findMany({
      endDate: {
        gte: new Date(),
        lte: futureDate,
      },
    })) as PatientTreatmentWithDetails[]
  }

  /**
   * Get treatment adherence report
   */
  async getTreatmentAdherenceReport(treatmentId: number): Promise<TreatmentAdherenceReport | null> {
    const treatment = await this.getTreatmentWithDetails(treatmentId)
    if (!treatment) return null

    const daysSinceStart = Math.ceil((new Date().getTime() - treatment.startDate.getTime()) / (1000 * 60 * 60 * 24))

    const expectedDuration = treatment.endDate
      ? Math.ceil((treatment.endDate.getTime() - treatment.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      treatment: {
        id: treatment.id,
        patient: treatment.patient,
        protocol: treatment.protocol,
        doctor: treatment.doctor,
      },
      daysSinceStart,
      expectedDuration,
      progress: expectedDuration ? (daysSinceStart / expectedDuration) * 100 : null,
      testResultsCount: treatment.testResults.length,
      lastTestDate: treatment.testResults[0]?.resultDate || null,
      notes: treatment.notes,
    }
  }
}
