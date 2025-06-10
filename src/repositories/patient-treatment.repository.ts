/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common'
import { PatientTreatment } from '@prisma/client'
import { PrismaService } from '../shared/services/prisma.service'
import { BaseRepository } from './base.repository'

// Types for PatientTreatment
export interface CreatePatientTreatmentData {
  patientId: number
  protocolId: number
  doctorId: number
  customMedications?: any // JSON data for custom medications
  notes?: string
  startDate: Date
  endDate?: Date
  total: number
}

export interface UpdatePatientTreatmentData {
  customMedications?: any
  notes?: string
  startDate?: Date
  endDate?: Date
  total?: number
}

export interface PatientTreatmentWithDetails extends PatientTreatment {
  patient: {
    id: number
    name: string
    email: string
    phoneNumber: string
  }
  protocol: {
    id: number
    name: string
    description: string | null
    targetDisease: string
    medicines: {
      id: number
      medicineId: number
      dosage: string
      duration: string
      notes: string | null
      medicine: {
        id: number
        name: string
        unit: string
        dose: string
        price: number
      }
    }[]
  }
  doctor: {
    id: number
    specialization: string
    user: {
      id: number
      name: string
      email: string
    }
  }
  createdBy: {
    id: number
    name: string
    email: string
  }
  testResults: {
    id: number
    name: string
    type: string
    result: string
    resultDate: Date
  }[]
}

export interface TreatmentFilters {
  patientId?: number
  doctorId?: number
  protocolId?: number
  isActive?: boolean
  startDateFrom?: Date
  startDateTo?: Date
}

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
   * Find treatments with advanced filtering
   */
  async findWithAdvancedFiltering(options: any, filters: TreatmentFilters = {}) {
    const additionalWhere: any = {}

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
  async getPatientTreatmentStats(patientId: number) {
    const treatments = await this.findMany({ patientId })

    const stats = {
      totalTreatments: treatments.length,
      activeTreatments: treatments.filter((t) => !t.endDate).length,
      completedTreatments: treatments.filter((t) => t.endDate).length,
      totalCost: treatments.reduce((sum, t) => sum + t.total, 0),
      averageDuration: 0,
      mostUsedProtocols: [] as any[],
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

    // Get protocol usage
    const protocolCount = treatments.reduce(
      (acc, t) => {
        acc[t.protocolId] = (acc[t.protocolId] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    return stats
  }

  /**
   * Get doctor's treatment statistics
   */
  async getDoctorTreatmentStats(doctorId: number) {
    const treatments = await this.findMany({ doctorId })

    return {
      totalTreatments: treatments.length,
      activeTreatments: treatments.filter((t) => !t.endDate).length,
      completedTreatments: treatments.filter((t) => t.endDate).length,
      totalRevenue: treatments.reduce((sum, t) => sum + t.total, 0),
      uniquePatients: new Set(treatments.map((t) => t.patientId)).size,
      averageTreatmentCost:
        treatments.length > 0 ? treatments.reduce((sum, t) => sum + t.total, 0) / treatments.length : 0,
    }
  }

  /**
   * Update treatment medications (custom medications)
   */
  async updateTreatmentMedications(
    treatmentId: number,
    customMedications: any,
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
  async getTreatmentAdherenceReport(treatmentId: number) {
    const treatment = await this.getTreatmentWithDetails(treatmentId)
    if (!treatment) return null

    // This would typically involve checking medication adherence, test results, etc.
    // For now, we'll return basic information
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
