import { Injectable } from '@nestjs/common'
import { ProtocolMedicine, TreatmentProtocol } from '@prisma/client'
import { PrismaService } from '../shared/services/prisma.service'
import {
  AddMedicineToProtocolData,
  CloneMedicineData,
  CreateTreatmentProtocolData,
  PopularProtocol,
  ProtocolFilters,
  ProtocolMedicineWithDetails,
  ProtocolUsageStats,
  ProtocolWhereInput,
  TreatmentProtocolWithMedicines,
  UpdateMedicineInProtocolData,
  UpdateTreatmentProtocolData,
} from '../shared/types'
import { BaseRepository, PaginationOptions, PaginationResult } from './base.repository'

@Injectable()
export class TreatmentProtocolRepository extends BaseRepository<
  TreatmentProtocol,
  CreateTreatmentProtocolData,
  UpdateTreatmentProtocolData
> {
  protected model = this.prisma.treatmentProtocol
  protected searchFields = ['name', 'description', 'targetDisease']

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  /**
   * Override default includes to include medicines and user info
   */
  protected getDefaultInclude() {
    return {
      medicines: {
        include: {
          medicine: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    }
  }

  /**
   * Create treatment protocol with medicines
   */
  async createWithMedicines(
    data: CreateTreatmentProtocolData,
    userId: number,
  ): Promise<TreatmentProtocolWithMedicines> {
    return await this.transaction(async (tx) => {
      // Create the protocol first
      const protocol = await tx.treatmentProtocol.create({
        data: {
          name: data.name,
          description: data.description,
          targetDisease: data.targetDisease,
          createdById: userId,
          updatedById: userId,
        },
      })

      // Add medicines if provided
      if (data.medicines && data.medicines.length > 0) {
        await tx.protocolMedicine.createMany({
          data: data.medicines.map((med) => ({
            protocolId: protocol.id,
            medicineId: med.medicineId,
            dosage: med.dosage,
            duration: med.duration,
            notes: med.notes,
          })),
        })
      }

      // Return protocol with medicines
      return (await tx.treatmentProtocol.findUnique({
        where: { id: protocol.id },
        include: this.getDefaultInclude(),
      })) as TreatmentProtocolWithMedicines
    })
  }

  /**
   * Add medicine to existing protocol
   */
  async addMedicineToProtocol(
    protocolId: number,
    medicineData: AddMedicineToProtocolData,
  ): Promise<ProtocolMedicineWithDetails> {
    return (await this.prisma.protocolMedicine.create({
      data: {
        protocolId,
        ...medicineData,
      },
      include: {
        medicine: true,
        protocol: true,
      },
    })) as ProtocolMedicineWithDetails
  }

  /**
   * Remove medicine from protocol
   */
  async removeMedicineFromProtocol(protocolId: number, medicineId: number): Promise<ProtocolMedicine> {
    return await this.prisma.protocolMedicine.delete({
      where: {
        protocolId_medicineId: {
          protocolId,
          medicineId,
        },
      },
    })
  }

  /**
   * Update medicine in protocol
   */
  async updateMedicineInProtocol(
    protocolId: number,
    medicineId: number,
    updateData: UpdateMedicineInProtocolData,
  ): Promise<ProtocolMedicineWithDetails> {
    return (await this.prisma.protocolMedicine.update({
      where: {
        protocolId_medicineId: {
          protocolId,
          medicineId,
        },
      },
      data: updateData,
      include: {
        medicine: true,
        protocol: true,
      },
    })) as ProtocolMedicineWithDetails
  }

  /**
   * Find protocols by target disease
   */
  async findByTargetDisease(targetDisease: string): Promise<TreatmentProtocolWithMedicines[]> {
    return (await this.findMany({
      targetDisease: { contains: targetDisease, mode: 'insensitive' },
    })) as TreatmentProtocolWithMedicines[]
  }

  /**
   * Find protocols created by specific doctor
   */
  async findByDoctor(doctorId: number): Promise<TreatmentProtocolWithMedicines[]> {
    return (await this.findMany({ createdById: doctorId })) as TreatmentProtocolWithMedicines[]
  }

  /**
   * Get protocol with detailed medicine information
   */
  async getProtocolWithDetails(protocolId: number): Promise<TreatmentProtocolWithMedicines | null> {
    return (await this.model.findUnique({
      where: { id: protocolId },
      include: {
        medicines: {
          include: {
            medicine: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        patientTreatments: {
          select: {
            id: true,
            patientId: true,
            startDate: true,
            endDate: true,
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })) as TreatmentProtocolWithMedicines | null
  }

  /**
   * Get protocols with advanced filtering
   */
  async findWithAdvancedFiltering(
    options: PaginationOptions,
    filters: ProtocolFilters = {},
  ): Promise<PaginationResult<TreatmentProtocol>> {
    const additionalWhere: ProtocolWhereInput = {}

    // Target disease filtering
    if (filters.targetDisease) {
      additionalWhere.targetDisease = {
        contains: filters.targetDisease,
        mode: 'insensitive',
      }
    }

    // Created by filtering
    if (filters.createdById) {
      additionalWhere.createdById = filters.createdById
    }

    // Name filtering
    if (filters.name) {
      additionalWhere.name = {
        contains: filters.name,
        mode: 'insensitive',
      }
    }

    return await this.findWithPagination(options, additionalWhere)
  }

  /**
   * Clone existing protocol for a doctor
   */
  async cloneProtocol(
    originalProtocolId: number,
    newData: {
      name: string
      description?: string
    },
    userId: number,
  ): Promise<TreatmentProtocolWithMedicines> {
    return await this.transaction(async (tx) => {
      // Get original protocol with medicines
      const originalProtocol = await tx.treatmentProtocol.findUnique({
        where: { id: originalProtocolId },
        include: {
          medicines: true,
        },
      })

      if (!originalProtocol) {
        throw new Error('Original protocol not found')
      }

      // Create new protocol
      const newProtocol = await tx.treatmentProtocol.create({
        data: {
          name: newData.name,
          description: newData.description || originalProtocol.description,
          targetDisease: originalProtocol.targetDisease,
          createdById: userId,
          updatedById: userId,
        },
      })

      // Copy medicines
      if (originalProtocol.medicines.length > 0) {
        await tx.protocolMedicine.createMany({
          data: originalProtocol.medicines.map(
            (med): CloneMedicineData => ({
              protocolId: newProtocol.id,
              medicineId: med.medicineId,
              dosage: med.dosage,
              duration: med.duration,
              notes: med.notes,
            }),
          ),
        })
      }

      // Return new protocol with medicines
      return (await tx.treatmentProtocol.findUnique({
        where: { id: newProtocol.id },
        include: this.getDefaultInclude(),
      })) as TreatmentProtocolWithMedicines
    })
  }

  /**
   * Get protocol usage statistics
   */
  async getProtocolUsageStats(protocolId: number): Promise<ProtocolUsageStats | null> {
    const protocol = await this.model.findUnique({
      where: { id: protocolId },
      include: {
        patientTreatments: {
          include: {
            patient: {
              select: { id: true, name: true, email: true },
            },
            doctor: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        medicines: {
          include: {
            medicine: true,
          },
        },
      },
    })

    if (!protocol) return null

    return {
      protocol: {
        id: protocol.id,
        name: protocol.name,
        description: protocol.description,
        targetDisease: protocol.targetDisease,
      },
      totalUsages: protocol.patientTreatments.length,
      activeTreatments: protocol.patientTreatments.filter((t) => !t.endDate).length,
      completedTreatments: protocol.patientTreatments.filter((t) => t.endDate).length,
      medicineCount: protocol.medicines.length,
      recentUsages: protocol.patientTreatments
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          patient: t.patient,
          doctor: t.doctor.user,
          startDate: t.startDate,
          endDate: t.endDate,
        })),
    }
  }

  /**
   * Get most popular protocols
   */
  async getMostPopularProtocols(limit = 10): Promise<PopularProtocol[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.executeRaw(
      `
      SELECT 
        tp.*,
        COUNT(pt.id) as usage_count,
        u.name as created_by_name
      FROM "TreatmentProtocol" tp
      LEFT JOIN "PatientTreatment" pt ON tp.id = pt."protocolId"
      LEFT JOIN "User" u ON tp."createdById" = u.id
      GROUP BY tp.id, u.name
      ORDER BY usage_count DESC
      LIMIT $1
    `,
      [limit],
    )
  }
}
