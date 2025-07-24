import { Injectable } from '@nestjs/common'
import { PatientTreatment, Prisma } from '@prisma/client'
import { z } from 'zod'
import { CreatePatientTreatmentSchema } from '../routes/patient-treatment/patient-treatment.model'
import { PaginationService } from '../shared/services/pagination.service'
import { PrismaService } from '../shared/services/prisma.service'

const DAYS_IN_MS = 1000 * 60 * 60 * 24

export const CreatePatientTreatmentDataSchema = CreatePatientTreatmentSchema.extend({
  createdById: z.number().positive('Created by ID must be positive'),
  total: z.number().min(0).optional(),
  isAnonymous: z.boolean().optional(),
})

export const UpdatePatientTreatmentDataSchema = CreatePatientTreatmentDataSchema.partial().omit({
  patientId: true,
  createdById: true,
})

@Injectable()
export class PatientTreatmentRepository {
  async findProtocolWithMedicines(protocolId: number) {
    if (!protocolId) return null
    return this.prismaService.treatmentProtocol.findUnique({
      where: { id: protocolId },
      include: {
        medicines: { include: { medicine: true } },
      },
    })
  }
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  private readonly defaultIncludes: Prisma.PatientTreatmentInclude = {
    patient: { select: { id: true, name: true, email: true, phoneNumber: true } },
    protocol: { include: { medicines: { include: { medicine: true } } } },
    doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
    createdBy: { select: { id: true, name: true, email: true } },
  }

  private readonly detailedIncludes: Prisma.PatientTreatmentInclude = {
    ...this.defaultIncludes,
  }

  protected validateId(id: number | string): number {
    const result = z.union([z.number().positive(), z.string().transform(Number)]).parse(id)
    return typeof result === 'string' ? parseInt(result, 10) : result
  }

  getPatientTreatmentModel() {
    return this.prismaService.patientTreatment
  }

  async createPatientTreatment(data: {
    patientId: number
    protocolId?: number
    doctorId: number
    customMedications?: any
    notes?: string
    startDate: Date
    endDate?: Date
    createdById: number
    total: number
    status?: boolean
    isAnonymous?: boolean
  }): Promise<PatientTreatment> {
    const validatedData = CreatePatientTreatmentDataSchema.parse(data)
    const customMedicationsJson = this.serializeCustomMedications(validatedData.customMedications)
    const payload: Prisma.PatientTreatmentUncheckedCreateInput = {
      patientId: validatedData.patientId,
      doctorId: validatedData.doctorId,
      customMedications: customMedicationsJson,
      notes: validatedData.notes,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      createdById: validatedData.createdById,
      total: data.total,
      protocolId: validatedData.protocolId ?? null,
      status: validatedData.status ?? false,
      isAnonymous: validatedData.isAnonymous ?? false,
    }
    try {
      return await this.prismaService.patientTreatment.create({
        data: payload,
        include: this.defaultIncludes,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

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

  async batchUpdatePatientTreatments(
    treatmentIds: number[],
    data: {
      endDate?: Date
      notes?: string
      total?: number
    },
  ): Promise<{ count: number }> {
    const validatedIds = treatmentIds.map((id) => this.validateId(id))
    try {
      const result = await this.prismaService.patientTreatment.updateMany({
        where: { id: { in: validatedIds } },
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

  async findPatientTreatments(params: {
    page?: number
    limit?: number
    where?: Prisma.PatientTreatmentWhereInput
    orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    include?: Prisma.PatientTreatmentInclude
  }): Promise<PatientTreatment[]> {
    const { page = 1, limit = 10, where, orderBy, include } = params
    return this.prismaService.patientTreatment.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy,
      include: include || this.defaultIncludes,
    })
  }

  async countPatientTreatments(where?: Prisma.PatientTreatmentWhereInput): Promise<number> {
    return this.prismaService.patientTreatment.count({ where })
  }

  async findPatientTreatmentsByPatientId(
    patientId: number,
    params: {
      page?: number
      limit?: number
      orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    },
  ): Promise<PatientTreatment[]> {
    const { page = 1, limit = 10, orderBy } = params
    return this.prismaService.patientTreatment.findMany({
      where: { patientId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: this.defaultIncludes,
    })
  }

  async countPatientTreatmentsByPatientId(patientId: number): Promise<number> {
    return this.prismaService.patientTreatment.count({ where: { patientId } })
  }

  async findPatientTreatmentsByDoctorId(
    doctorId: number,
    params: {
      page?: number
      limit?: number
      orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    },
  ): Promise<PatientTreatment[]> {
    const { page = 1, limit = 10, orderBy } = params
    return this.prismaService.patientTreatment.findMany({
      where: { doctorId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: this.defaultIncludes,
    })
  }

  async searchPatientTreatments(query: string): Promise<PatientTreatment[]> {
    const validatedQuery = z.string().min(1).parse(query)
    try {
      return await this.prismaService.patientTreatment.findMany({
        where: {
          OR: [
            { notes: { contains: validatedQuery, mode: 'insensitive' } },
            { patient: { name: { contains: validatedQuery, mode: 'insensitive' } } },
            { doctor: { user: { name: { contains: validatedQuery, mode: 'insensitive' } } } },
          ],
        },
        include: this.defaultIncludes,
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  async getPatientTreatmentsByDateRange(startDate: Date, endDate: Date): Promise<PatientTreatment[]> {
    const { startDate: validStartDate, endDate: validEndDate } = z
      .object({ startDate: z.date(), endDate: z.date() })
      .refine((data) => data.endDate >= data.startDate, { message: 'End date must be after start date' })
      .parse({ startDate, endDate })
    try {
      return await this.prismaService.patientTreatment.findMany({
        where: { startDate: { gte: validStartDate, lte: validEndDate } },
        include: this.defaultIncludes,
        orderBy: { startDate: 'desc' },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  async getActivePatientTreatments(
    params: {
      patientId?: number
      page?: number
      limit?: number
      orderBy?: Prisma.PatientTreatmentOrderByWithRelationInput
    } = {},
  ): Promise<PatientTreatment[]> {
    const { patientId, page = 1, limit = 10, orderBy } = params
    const currentDate = new Date()
    try {
      const where: Prisma.PatientTreatmentWhereInput = {
        OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
      }
      if (patientId) where.patientId = patientId
      return await this.prismaService.patientTreatment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: orderBy || { startDate: 'desc' },
        include: this.defaultIncludes,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  async getActivePatientTreatmentsByPatientId(
    patientId: number,
    includeHistory = false,
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
        if (!isStarted) treatmentStatus = 'upcoming'
        else if (daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0) treatmentStatus = 'ending_soon'
        else treatmentStatus = 'active'
        return { ...treatment, isCurrent, isStarted, daysRemaining, treatmentStatus }
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  async getActivePatientTreatmentsSummary(patientId?: number): Promise<{
    totalActiveTreatments: number
    treatmentsByStatus: { upcoming: number; active: number; ending_soon: number }
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
      const allActiveTreatments = await this.prismaService.patientTreatment.findMany({
        where: {
          OR: [{ endDate: null }, { endDate: { gt: currentDate } }],
          ...(patientId && { patientId: this.validateId(patientId) }),
        },
        select: { startDate: true, endDate: true },
      })
      const treatmentsByStatus = allActiveTreatments.reduce(
        (acc, treatment) => {
          const startDate = new Date(treatment.startDate)
          const endDate = treatment.endDate ? new Date(treatment.endDate) : null
          const isStarted = startDate <= currentDate
          if (!isStarted) acc.upcoming++
          else if (endDate) {
            const daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / DAYS_IN_MS)
            if (daysRemaining <= 7 && daysRemaining > 0) acc.ending_soon++
            else acc.active++
          } else acc.active++
          return acc
        },
        { upcoming: 0, active: 0, ending_soon: 0 },
      )
      const result = { totalActiveTreatments, treatmentsByStatus, recentTreatments }
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

  private handlePrismaError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'unknown field'
          return new Error(`Unique constraint violation on field(s): ${target}`)
        }
        case 'P2025':
          return new Error('Patient treatment record not found')
        case 'P2003':
          return new Error('Foreign key constraint violation - referenced record does not exist')
        case 'P2011':
          return new Error('Null constraint violation')
        case 'P2012':
          return new Error('Missing required value')
        default:
          return new Error(`Database operation failed: ${error.message}`)
      }
    }
    if (error instanceof Prisma.PrismaClientUnknownRequestError) return new Error('Unknown database error occurred')
    if (error instanceof Prisma.PrismaClientRustPanicError) return new Error('Database engine error occurred')
    if (error instanceof Error) return error
    return new Error('An unknown error occurred during patient treatment operation')
  }
}
