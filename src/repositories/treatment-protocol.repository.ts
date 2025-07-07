import { Injectable } from '@nestjs/common'
import { MedicationSchedule, Prisma, ProtocolMedicine, TreatmentProtocol } from '@prisma/client'
import { z } from 'zod'
import { PaginatedResponse } from '../shared/schemas/pagination.schema'
import { PaginationService } from '../shared/services/pagination.service'
import { PrismaService } from '../shared/services/prisma.service'

export const ProtocolMedicineSchema = z.object({
  medicineId: z.number().positive('Medicine ID must be positive'),
  dosage: z.string().min(1, 'Dosage is required'),
  duration: z.nativeEnum(MedicationSchedule),
  notes: z.string().optional(),
})

export const CreateTreatmentProtocolDataSchema = z.object({
  name: z.string().min(1, 'Protocol name is required').max(500),
  description: z.string().optional(),
  targetDisease: z.string().min(1, 'Target disease is required').max(200),
  createdById: z.number().positive('Created by ID must be positive'),
  updatedById: z.number().positive('Updated by ID must be positive'),
  medicines: z.array(ProtocolMedicineSchema).min(1, 'At least one medicine is required'),
})

export const UpdateTreatmentProtocolDataSchema = CreateTreatmentProtocolDataSchema.partial().omit({
  createdById: true,
})

@Injectable()
export class TreatmentProtocolRepository {
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
   * @returns Prisma TreatmentProtocol model delegate
   */
  getTreatmentProtocolModel() {
    return this.prismaService.treatmentProtocol
  }

  // Create new treatment protocol with validation
  async createTreatmentProtocol(data: {
    name: string
    description?: string
    targetDisease: string
    createdById: number
    updatedById: number
    medicines: {
      medicineId: number
      dosage: string
      duration: MedicationSchedule
      notes?: string
    }[]
  }): Promise<TreatmentProtocol> {
    // Validate input data
    const validatedData = CreateTreatmentProtocolDataSchema.parse(data)

    try {
      return await this.prismaService.treatmentProtocol.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          targetDisease: validatedData.targetDisease,
          createdById: validatedData.createdById,
          updatedById: validatedData.updatedById,
          medicines: {
            create: validatedData.medicines.map((medicine) => ({
              medicineId: medicine.medicineId,
              dosage: medicine.dosage,
              duration: medicine.duration,
              notes: medicine.notes,
            })),
          },
        },
        include: {
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
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Find treatment protocol by ID with validation
  async findTreatmentProtocolById(
    id: number,
    include?: Prisma.TreatmentProtocolInclude,
  ): Promise<TreatmentProtocol | null> {
    const validatedId = this.validateId(id)

    try {
      return await this.prismaService.treatmentProtocol.findUnique({
        where: { id: validatedId },
        include: include || {
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
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Find treatment protocol by name with validation
  async findTreatmentProtocolByName(name: string): Promise<TreatmentProtocol | null> {
    const nameSchema = z.string().min(1, 'Name is required')
    const validatedName = nameSchema.parse(name)

    try {
      return await this.prismaService.treatmentProtocol.findFirst({
        where: { name: validatedName },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Update treatment protocol
  async updateTreatmentProtocol(
    id: number,
    data: {
      name?: string
      description?: string
      targetDisease?: string
      updatedById: number
      medicines?: {
        id?: number
        medicineId: number
        dosage: string
        duration: MedicationSchedule
        notes?: string
      }[]
    },
  ): Promise<TreatmentProtocol> {
    const updateData: Prisma.TreatmentProtocolUpdateInput = {
      name: data.name,
      description: data.description,
      targetDisease: data.targetDisease,
      updatedBy: {
        connect: { id: data.updatedById },
      },
    }

    // If medicines are provided, update them
    if (data.medicines) {
      // Delete existing medicines and create new ones
      updateData.medicines = {
        deleteMany: {},
        create: data.medicines.map((medicine) => ({
          medicineId: medicine.medicineId,
          dosage: medicine.dosage,
          duration: medicine.duration,
          notes: medicine.notes,
        })),
      }
    }

    return this.prismaService.treatmentProtocol.update({
      where: { id },
      data: updateData,
      include: {
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
      },
    })
  }

  // Delete treatment protocol
  async deleteTreatmentProtocol(id: number): Promise<TreatmentProtocol> {
    return this.prismaService.treatmentProtocol.delete({
      where: { id },
    })
  }

  // Find all treatment protocols with filtering
  async findTreatmentProtocols(params: {
    skip?: number
    take?: number
    where?: Prisma.TreatmentProtocolWhereInput
    orderBy?: Prisma.TreatmentProtocolOrderByWithRelationInput
    include?: Prisma.TreatmentProtocolInclude
  }): Promise<TreatmentProtocol[]> {
    const { skip, take, where, orderBy, include } = params
    return this.prismaService.treatmentProtocol.findMany({
      skip,
      take,
      where,
      orderBy,
      include: include || {
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
      },
    })
  }

  // Count treatment protocols with filtering
  async countTreatmentProtocols(where?: Prisma.TreatmentProtocolWhereInput): Promise<number> {
    return this.prismaService.treatmentProtocol.count({
      where,
    })
  }

  // Search treatment protocols by name or target disease
  async searchTreatmentProtocols(query: string): Promise<TreatmentProtocol[]> {
    return this.prismaService.treatmentProtocol.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            targetDisease: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        medicines: {
          include: {
            medicine: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
  }

  // Advanced search treatment protocols with validation
  async advancedSearchTreatmentProtocols(params: {
    query?: string
    targetDisease?: string
    limit?: number
    page?: number
  }): Promise<TreatmentProtocol[]> {
    const searchParamsSchema = z.object({
      query: z.string().min(1).optional(),
      targetDisease: z.string().min(1).optional(),
      limit: z.number().min(1).max(100).optional().default(10),
      page: z.number().min(1).optional().default(1),
    })

    const validatedParams = searchParamsSchema.parse(params)

    const where: Prisma.TreatmentProtocolWhereInput = {}

    // Build search conditions
    if (validatedParams.query) {
      where.OR = [
        { name: { contains: validatedParams.query, mode: 'insensitive' } },
        { description: { contains: validatedParams.query, mode: 'insensitive' } },
      ]
    }

    if (validatedParams.targetDisease) {
      where.targetDisease = { contains: validatedParams.targetDisease, mode: 'insensitive' }
    }

    const skip = (validatedParams.page - 1) * validatedParams.limit

    try {
      return await this.prismaService.treatmentProtocol.findMany({
        where,
        skip,
        take: validatedParams.limit,
        include: {
          medicines: {
            include: {
              medicine: true,
            },
          },
          _count: {
            select: {
              patientTreatments: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Get protocol usage statistics
  async getProtocolUsageStats(protocolId: number): Promise<{
    protocol: TreatmentProtocol | null
    usageCount: number
    activeUsageCount: number
  }> {
    const validatedId = this.validateId(protocolId)

    try {
      const [protocol, usageCount, activeUsageCount] = await Promise.all([
        this.prismaService.treatmentProtocol.findUnique({
          where: { id: validatedId },
          include: {
            medicines: {
              include: {
                medicine: true,
              },
            },
          },
        }),
        this.prismaService.patientTreatment.count({
          where: { protocolId: validatedId },
        }),
        this.prismaService.patientTreatment.count({
          where: {
            protocolId: validatedId,
            endDate: {
              gt: new Date(),
            },
          },
        }),
      ])

      return {
        protocol,
        usageCount,
        activeUsageCount,
      }
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Clone an existing treatment protocol with new name
   * Useful for creating variations of successful protocols
   *
   * @param originalId - ID of protocol to clone
   * @param newName - Name for the cloned protocol
   * @param createdById - ID of user creating the clone
   * @returns Newly created cloned protocol
   */
  async cloneTreatmentProtocol(originalId: number, newName: string, createdById: number): Promise<TreatmentProtocol> {
    const validatedOriginalId = this.validateId(originalId)
    const validatedCreatedById = this.validateId(createdById)

    const nameSchema = z.string().min(1, 'Protocol name is required').max(500)
    const validatedName = nameSchema.parse(newName)

    try {
      // First, get the original protocol with all its medicines
      const originalProtocol = await this.prismaService.treatmentProtocol.findUnique({
        where: { id: validatedOriginalId },
        include: {
          medicines: true,
        },
      })

      if (!originalProtocol) {
        throw new Error(`Treatment protocol with ID ${validatedOriginalId} not found`)
      }

      // Create the cloned protocol
      return await this.prismaService.treatmentProtocol.create({
        data: {
          name: validatedName,
          description: originalProtocol.description
            ? `Cloned from: ${originalProtocol.name}. ${originalProtocol.description}`
            : `Cloned from: ${originalProtocol.name}`,
          targetDisease: originalProtocol.targetDisease,
          createdById: validatedCreatedById,
          updatedById: validatedCreatedById,
          medicines: {
            create: originalProtocol.medicines.map((medicine) => ({
              medicineId: medicine.medicineId,
              dosage: medicine.dosage,
              duration: medicine.duration,
              notes: medicine.notes,
            })),
          },
        },
        include: {
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
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Create custom treatment protocol from existing treatment
   * Generates a new protocol based on successful patient treatment with custom medications
   *
   * @param treatmentId - ID of patient treatment to base the protocol on
   * @param protocolData - New protocol information
   * @returns Newly created custom protocol
   */
  async createCustomProtocolFromTreatment(
    treatmentId: number,
    protocolData: {
      name: string
      description?: string
      targetDisease: string
      createdById: number
    },
  ): Promise<TreatmentProtocol> {
    const validatedTreatmentId = this.validateId(treatmentId)
    const validatedCreatedById = this.validateId(protocolData.createdById)

    const protocolSchema = z.object({
      name: z.string().min(1, 'Protocol name is required').max(500),
      description: z.string().optional(),
      targetDisease: z.string().min(1, 'Target disease is required').max(200),
    })
    const validatedProtocolData = protocolSchema.parse(protocolData)

    try {
      // Get the patient treatment with custom medications
      const treatment = await this.prismaService.patientTreatment.findUnique({
        where: { id: validatedTreatmentId },
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
        },
      })

      if (!treatment) {
        throw new Error(`Patient treatment with ID ${validatedTreatmentId} not found`)
      }

      // Extract medicines from both protocol and custom medications
      const protocolMedicines = treatment.protocol.medicines.map((pm) => ({
        medicineId: pm.medicineId,
        dosage: pm.dosage,
        duration: pm.duration,
        notes: pm.notes,
      }))

      // Parse custom medications if they exist
      let customMedicines: any[] = []
      if (treatment.customMedications) {
        try {
          const customMeds = treatment.customMedications as any[]
          customMedicines = customMeds.map((cm) => ({
            medicineId: cm.medicineId,
            dosage: cm.dosage,
            duration: 'DAILY' as any, // Default duration for custom medicines
            notes: cm.notes || `Custom: ${cm.frequency}, Duration: ${cm.duration?.value} ${cm.duration?.unit}`,
          }))
        } catch (error) {
          console.warn('Error parsing custom medications:', error)
        }
      }

      // Combine protocol medicines and custom medicines
      const allMedicines = [...protocolMedicines, ...customMedicines]

      // Create the new custom protocol
      return await this.prismaService.treatmentProtocol.create({
        data: {
          name: validatedProtocolData.name,
          description:
            validatedProtocolData.description ||
            `Custom protocol created from successful treatment. Original protocol: ${treatment.protocol.name}`,
          targetDisease: validatedProtocolData.targetDisease,
          createdById: validatedCreatedById,
          updatedById: validatedCreatedById,
          medicines: {
            create: allMedicines,
          },
        },
        include: {
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
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get treatment protocols with custom medicine variations
   * Returns protocols that include custom medication additions beyond standard protocol
   *
   * @param params - Query parameters for filtering
   * @returns Protocols with their usage in custom treatments
   */
  async getProtocolsWithCustomVariations(
    params: {
      skip?: number
      take?: number
      targetDisease?: string
    } = {},
  ): Promise<
    Array<
      TreatmentProtocol & {
        _count: { patientTreatments: number }
        customUsageCount: number
        medicines: Array<ProtocolMedicine & { medicine: any }>
      }
    >
  > {
    const { skip, take, targetDisease } = params

    try {
      const where: Prisma.TreatmentProtocolWhereInput = {}
      if (targetDisease) {
        where.targetDisease = { contains: targetDisease, mode: 'insensitive' }
      }

      const protocols = await this.prismaService.treatmentProtocol.findMany({
        where,
        skip,
        take,
        include: {
          medicines: {
            include: {
              medicine: true,
            },
          },
          _count: {
            select: {
              patientTreatments: true,
            },
          },
        },
        orderBy: [{ patientTreatments: { _count: 'desc' } }, { name: 'asc' }],
      })

      // Get custom usage count for each protocol
      const protocolsWithCustomData = await Promise.all(
        protocols.map(async (protocol) => {
          const customUsageCount = await this.prismaService.patientTreatment.count({
            where: {
              protocolId: protocol.id,
              customMedications: { not: Prisma.DbNull },
            },
          })

          return {
            ...protocol,
            customUsageCount,
          }
        }),
      )

      return protocolsWithCustomData
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get most popular treatment protocols
   * Returns protocols sorted by usage frequency
   *
   * @param limit - Maximum number of protocols to return
   * @returns Most frequently used protocols with statistics
   */
  async getMostPopularProtocols(limit: number = 10): Promise<
    Array<
      TreatmentProtocol & {
        _count: { patientTreatments: number }
      }
    >
  > {
    const limitSchema = z.number().min(1).max(100)
    const validatedLimit = limitSchema.parse(limit)

    try {
      return await this.prismaService.treatmentProtocol.findMany({
        include: {
          medicines: {
            include: {
              medicine: true,
            },
          },
          _count: {
            select: {
              patientTreatments: true,
            },
          },
        },
        orderBy: {
          patientTreatments: { _count: 'desc' },
        },
        take: validatedLimit,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Get protocol effectiveness metrics
   * Analyzes treatment outcomes for protocol evaluation
   *
   * @param protocolId - Protocol ID to analyze
   * @returns Effectiveness metrics and statistics
   */
  async getProtocolEffectivenessMetrics(protocolId: number): Promise<{
    protocol: TreatmentProtocol | null
    totalUsages: number
    completedTreatments: number
    activeTreatments: number
    averageTreatmentDuration: number | null
    averageCost: number
    successRate: number | null
  }> {
    const validatedId = this.validateId(protocolId)
    const currentDate = new Date()

    try {
      const [protocol, treatments] = await Promise.all([
        this.prismaService.treatmentProtocol.findUnique({
          where: { id: validatedId },
          include: {
            medicines: {
              include: {
                medicine: true,
              },
            },
          },
        }),
        this.prismaService.patientTreatment.findMany({
          where: { protocolId: validatedId },
          select: {
            startDate: true,
            endDate: true,
            total: true,
          },
        }),
      ])

      if (!protocol) {
        throw new Error(`Treatment protocol with ID ${validatedId} not found`)
      }

      const totalUsages = treatments.length
      const completedTreatments = treatments.filter((t) => t.endDate && t.endDate <= currentDate).length
      const activeTreatments = treatments.filter((t) => !t.endDate || t.endDate > currentDate).length

      // Calculate average treatment duration for completed treatments
      const completedTreatmentData = treatments.filter((t) => t.endDate && t.endDate <= currentDate)
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

      // Calculate average cost
      const totalCost = treatments.reduce((sum, treatment) => sum + treatment.total, 0)
      const averageCost = totalUsages > 0 ? totalCost / totalUsages : 0

      // Calculate success rate (for now, completed treatments are considered successful)
      // This can be enhanced with actual outcome data
      const successRate = totalUsages > 0 ? (completedTreatments / totalUsages) * 100 : null

      return {
        protocol,
        totalUsages,
        completedTreatments,
        activeTreatments,
        averageTreatmentDuration,
        averageCost: Math.round(averageCost * 100) / 100, // Round to 2 decimal places
        successRate: successRate ? Math.round(successRate * 100) / 100 : null,
      }
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  /**
   * Find treatment protocols with pagination using PaginationService
   * Provides paginated results with metadata for efficient data loading
   *
   * @param query - Query parameters including pagination, filtering, and search
   * @returns Paginated treatment protocols with metadata
   */
  async findTreatmentProtocolsPaginated(query: any): Promise<PaginatedResponse<any>> {
    try {
      // Parse pagination options
      const paginationOptions = this.paginationService.getPaginationOptions(query)

      // Build where condition
      const where: Prisma.TreatmentProtocolWhereInput = {}

      // Add filters if provided with proper validation
      if (query.targetDisease) {
        const targetDiseaseSchema = z.string().min(1)
        where.targetDisease = {
          contains: targetDiseaseSchema.parse(query.targetDisease),
          mode: 'insensitive',
        }
      }
      if (query.createdById) {
        const createdByIdSchema = z.union([z.number(), z.string().transform(Number)])
        where.createdById = createdByIdSchema.parse(query.createdById)
      }

      // Add search conditions if search term is provided
      if (paginationOptions.search) {
        where.OR = [
          {
            name: {
              contains: paginationOptions.search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: paginationOptions.search,
              mode: 'insensitive',
            },
          },
          {
            targetDisease: {
              contains: paginationOptions.search,
              mode: 'insensitive',
            },
          },
        ]
      }

      // Use PaginationService for paginated results
      return await this.paginationService.paginate(this.getTreatmentProtocolModel(), paginationOptions, where, {
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
        _count: {
          select: {
            patientTreatments: true,
          },
        },
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Business Logic Validation Methods

  /**
   * Validate if treatment protocol can be safely deleted
   */
  async validateProtocolCanBeDeleted(id: number): Promise<{
    canDelete: boolean
    activePatientTreatments: number
    totalPatientTreatments: number
  }> {
    const validatedId = this.validateId(id)

    // Check for active patient treatments using this protocol
    const activeCount = await this.prismaService.patientTreatment.count({
      where: {
        protocolId: validatedId,
        OR: [
          { endDate: null }, // No end date means still active
          { endDate: { gt: new Date() } }, // End date in future
        ],
      },
    })

    // Check total patient treatments (for reference)
    const totalCount = await this.prismaService.patientTreatment.count({
      where: { protocolId: validatedId },
    })

    return {
      canDelete: activeCount === 0,
      activePatientTreatments: activeCount,
      totalPatientTreatments: totalCount,
    }
  }

  /**
   * Validate treatment protocol business rules
   */
  async validateProtocolBusinessRules(data: {
    name: string
    targetDisease: string
    medicines: Array<{
      medicineId: number
      dosage: string
      duration: MedicationSchedule
      notes?: string
    }>
  }): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for duplicate protocol name
    const existingProtocol = await this.prismaService.treatmentProtocol.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    })

    if (existingProtocol) {
      errors.push(`Treatment protocol with name '${data.name}' already exists`)
    }

    // Validate medicines exist
    const medicineIds = data.medicines.map((m) => m.medicineId)
    const existingMedicines = await this.prismaService.medicine.findMany({
      where: { id: { in: medicineIds } },
      select: { id: true, name: true },
    })

    const missingMedicines = medicineIds.filter((id) => !existingMedicines.some((m) => m.id === id))

    if (missingMedicines.length > 0) {
      errors.push(`Medicine IDs not found: ${missingMedicines.join(', ')}`)
    }

    // Check for duplicate medicines in protocol
    const duplicateMedicines = medicineIds.filter((id, index) => medicineIds.indexOf(id) !== index)

    if (duplicateMedicines.length > 0) {
      errors.push(`Duplicate medicines in protocol: ${duplicateMedicines.join(', ')}`)
    }

    // Validate dosage formats
    for (const medicine of data.medicines) {
      if (!medicine.dosage || medicine.dosage.trim().length === 0) {
        errors.push(`Dosage is required for medicine ID ${medicine.medicineId}`)
      }

      // Check if dosage contains some numeric value
      const hasNumber = /\d/.test(medicine.dosage)
      if (!hasNumber) {
        warnings.push(`Dosage for medicine ID ${medicine.medicineId} should contain numeric value`)
      }
    }

    // Validate target disease
    if (!data.targetDisease || data.targetDisease.trim().length === 0) {
      errors.push('Target disease is required')
    }

    // Business rule: At least one medicine required
    if (data.medicines.length === 0) {
      errors.push('Protocol must contain at least one medicine')
    }

    // Warning for too many medicines
    if (data.medicines.length > 10) {
      warnings.push('Protocol contains many medicines. Consider reviewing for complexity.')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Calculate estimated protocol cost
   */
  async calculateProtocolCost(protocolId: number): Promise<{
    totalCost: number
    medicinesCost: Array<{
      medicineId: number
      medicineName: string
      unitPrice: number
      dosage: string
      duration: MedicationSchedule
      estimatedCost: number
    }>
  }> {
    const protocol = await this.prismaService.treatmentProtocol.findUnique({
      where: { id: protocolId },
      include: {
        medicines: {
          include: {
            medicine: true,
          },
        },
      },
    })

    if (!protocol) {
      throw new Error('Treatment protocol not found')
    }

    const medicinesCost = protocol.medicines.map((pm) => {
      // Simple cost estimation based on duration
      const multiplier = pm.duration === 'MORNING' ? 30 : pm.duration === 'AFTERNOON' ? 30 : 30 // Daily for 30 days
      const estimatedCost = Number(pm.medicine.price) * multiplier

      return {
        medicineId: pm.medicineId,
        medicineName: pm.medicine.name,
        unitPrice: Number(pm.medicine.price),
        dosage: pm.dosage,
        duration: pm.duration,
        estimatedCost,
      }
    })

    const totalCost = medicinesCost.reduce((sum, mc) => sum + mc.estimatedCost, 0)

    return {
      totalCost,
      medicinesCost,
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
          return new Error('Treatment protocol record not found')
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

    return new Error('An unknown error occurred during treatment protocol operation')
  }
}
