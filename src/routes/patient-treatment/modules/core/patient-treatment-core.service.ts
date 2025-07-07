import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
} from '@nestjs/common'
import { PatientTreatment, Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { DoctorRepository } from '../../../../repositories/doctor.repository'
import { PatientTreatmentRepository } from '../../../../repositories/patient-treatment.repository'
import { TreatmentProtocolRepository } from '../../../../repositories/treatment-protocol.repository'
import { AuthRepository } from '../../../../repositories/user.repository'
import { PaginatedResponse } from '../../../../shared/schemas/pagination.schema'
import { PaginationService } from '../../../../shared/services/pagination.service'
import { CreatePatientTreatmentSchema, UpdatePatientTreatmentSchema } from '../../patient-treatment.model'
import { FollowUpAppointmentService } from '../../services/follow-up-appointment.service'

@Injectable()
export class PatientTreatmentCoreService {
  constructor(
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly paginationService: PaginationService,
    private readonly followUpAppointmentService: FollowUpAppointmentService,
    private readonly authRepository: AuthRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly treatmentProtocolRepository: TreatmentProtocolRepository,
  ) {}

  // Create new patient treatment
  async createPatientTreatment(data: any, userId: number, autoEndExisting: boolean = false): Promise<PatientTreatment> {
    try {
      // 1. Validate user ID
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        throw new BadRequestException('Valid user ID is required')
      }

      // 2. Validate required input data
      if (!data) {
        throw new BadRequestException('Treatment data is required')
      }

      // 3. Transform and validate data structure
      let transformedData: any
      try {
        transformedData = {
          ...data,
          patientId: data.patientId ? Number(data.patientId) : undefined,
          doctorId: data.doctorId ? Number(data.doctorId) : undefined,
          protocolId: data.protocolId ? Number(data.protocolId) : undefined,
          startDate: data.startDate ? String(data.startDate) : undefined,
          endDate: data.endDate ? String(data.endDate) : undefined,
          customMedications: data.customMedications
            ? typeof data.customMedications === 'string'
              ? JSON.parse(String(data.customMedications))
              : data.customMedications
            : {},
        }
      } catch (parseError) {
        throw new BadRequestException(`Invalid data format: ${parseError.message}`)
      }

      // 4. Schema validation
      let validatedData: any
      try {
        validatedData = CreatePatientTreatmentSchema.parse(transformedData)
      } catch (error) {
        if (error instanceof ZodError) {
          const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')
          throw new BadRequestException(`Validation error: ${errorMessages}`)
        }
        throw new BadRequestException('Invalid treatment data format')
      }

      // 5. Validate date logic
      const startDate = new Date(String(validatedData.startDate))
      const currentDate = new Date()

      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format')
      }

      if (validatedData.endDate) {
        const endDate = new Date(String(validatedData.endDate))
        if (isNaN(endDate.getTime())) {
          throw new BadRequestException('Invalid end date format')
        }
        if (endDate <= startDate) {
          throw new BadRequestException('End date must be after start date')
        }
      }

      // 6. Check for existing active treatments (business rule validation)
      try {
        const activeExisting = await this.patientTreatmentRepository.getActivePatientTreatments({
          patientId: Number(validatedData.patientId),
        })

        if (activeExisting.length > 0 && !autoEndExisting) {
          const activeTreatmentIds = activeExisting.map((t) => t.id).join(', ')
          throw new ConflictException(
            `Patient already has active treatment(s) with ID(s): ${activeTreatmentIds}. ` +
              'Use autoEndExisting=true to automatically end them or manually end them first.',
          )
        }

        // 7. Handle auto-ending existing treatments if requested
        if (autoEndExisting && activeExisting.length > 0) {
          const newTreatmentStartDate = new Date(String(validatedData.startDate))
          const endDate = new Date(newTreatmentStartDate.getTime() - 1000) // 1 second before new treatment

          for (const treatment of activeExisting) {
            const treatmentStartDate = new Date(treatment.startDate)
            if (endDate < treatmentStartDate) {
              throw new ConflictException(
                `Cannot auto-end treatment ID ${treatment.id}: ` +
                  'New treatment start date must be after existing treatment start date',
              )
            }
          }

          // Actually end the existing treatments
          for (const treatment of activeExisting) {
            try {
              await this.patientTreatmentRepository.updatePatientTreatment(treatment.id, {
                endDate: endDate,
              })
            } catch (updateError) {
              throw new InternalServerErrorException(
                `Failed to auto-end existing treatment ${treatment.id}: ${updateError.message}`,
              )
            }
          }
        }
      } catch (error) {
        if (error instanceof ConflictException || error instanceof InternalServerErrorException) {
          throw error
        }
        throw new InternalServerErrorException(`Error checking existing treatments: ${error.message}`)
      }

      // 8. Validate foreign key references exist
      try {
        // Check if patient exists
        const patient = await this.authRepository.findUserById(Number(validatedData.patientId))
        if (!patient) {
          throw new BadRequestException(`Patient with ID ${validatedData.patientId} not found`)
        }

        // Check if doctor exists
        const doctor = await this.doctorRepository.findDoctorById(Number(validatedData.doctorId))
        if (!doctor) {
          throw new BadRequestException(`Doctor with ID ${validatedData.doctorId} not found`)
        }

        // Check if treatment protocol exists
        const protocol = await this.treatmentProtocolRepository.findTreatmentProtocolById(
          Number(validatedData.protocolId),
        )
        if (!protocol) {
          throw new BadRequestException(`Treatment protocol with ID ${validatedData.protocolId} not found`)
        }

        // Additional business rule: Ensure doctor is active/available
        if (!doctor.isAvailable) {
          throw new BadRequestException(
            `Doctor with ID ${validatedData.doctorId} is not available and cannot be assigned to treatments`,
          )
        }

        // Additional business rule: Ensure patient is eligible for treatment
        if (patient.status === 'INACTIVE') {
          throw new BadRequestException(
            `Patient with ID ${validatedData.patientId} is inactive and cannot be assigned to new treatments`,
          )
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error
        }
        throw new InternalServerErrorException(`Error validating foreign key references: ${error.message}`)
      }

      // 9. Create the new treatment
      const createData = {
        patientId: Number(validatedData.patientId),
        protocolId: Number(validatedData.protocolId),
        doctorId: Number(validatedData.doctorId),
        customMedications: validatedData.customMedications,
        notes: validatedData.notes,
        startDate: new Date(String(validatedData.startDate)),
        endDate: validatedData.endDate ? new Date(String(validatedData.endDate)) : undefined,
        createdById: userId,
        total: Number(validatedData.total) || 0,
      }

      let newTreatment: PatientTreatment
      try {
        newTreatment = await this.patientTreatmentRepository.createPatientTreatment(createData)
      } catch (error) {
        // Handle Prisma/Database specific errors
        if (error.code === 'P2002') {
          throw new ConflictException('Treatment with these details already exists')
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid reference - patient, doctor, or protocol does not exist')
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Referenced record not found')
        }
        if (error.message && error.message.includes('Foreign key constraint')) {
          throw new BadRequestException('Invalid reference IDs provided')
        }

        console.error('Database error creating treatment:', error)
        throw new InternalServerErrorException('Failed to create patient treatment')
      }

      // 10. Automatically create follow-up appointments (non-blocking)
      try {
        await this.followUpAppointmentService.createFollowUpAppointment(newTreatment.id, {
          dayOffset: 30,
          notes: `Auto-generated follow-up appointment for treatment #${newTreatment.id}`,
        })
        console.log(`Follow-up appointment created for treatment ${newTreatment.id}`)
      } catch (followUpError) {
        // Log but don't fail the entire operation
        console.warn(`Failed to create follow-up appointment for treatment ${newTreatment.id}:`, followUpError.message)
      }

      return newTreatment
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException ||
        error instanceof HttpException
      ) {
        throw error
      }
      throw new InternalServerErrorException('An unexpected error occurred while creating patient treatment')
    }
  }

  // Get all patient treatments with pagination
  async getAllPatientTreatments(query: any): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', startDate, endDate } = query

      // Build where clause
      const where: Prisma.PatientTreatmentWhereInput = {}

      if (search) {
        where.OR = [
          { patient: { name: { contains: search, mode: 'insensitive' } } },
          { patient: { email: { contains: search, mode: 'insensitive' } } },
          { doctor: { user: { name: { contains: search, mode: 'insensitive' } } } },
        ]
      }

      if (startDate || endDate) {
        where.startDate = {}
        if (startDate) where.startDate.gte = new Date(startDate)
        if (endDate) where.startDate.lte = new Date(endDate)
      }

      // Use repository method
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
      throw new InternalServerErrorException('Error getting all patient treatments')
    }
  }

  // Get patient treatments by patient ID
  async getPatientTreatmentsByPatientId(query: any): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      const { patientId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query

      const skip = (page - 1) * limit
      const [data, total] = await Promise.all([
        this.patientTreatmentRepository.findPatientTreatmentsByPatientId(patientId, {
          skip,
          take: limit,
        }),
        this.patientTreatmentRepository.countPatientTreatmentsByPatientId(patientId),
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
      throw new InternalServerErrorException('Error getting patient treatments by patient ID')
    }
  }

  // Get patient treatments by doctor ID
  async getPatientTreatmentsByDoctorId(query: any): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      const { doctorId, page = 1, limit = 10 } = query

      const skip = (page - 1) * limit
      const data = await this.patientTreatmentRepository.findPatientTreatmentsByDoctorId(doctorId, {
        skip,
        take: limit,
      })

      // Count total (simplified approach)
      const total = await this.patientTreatmentRepository.countPatientTreatments({ doctorId })

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
      throw new InternalServerErrorException('Error getting patient treatments by doctor ID')
    }
  }

  // Search patient treatments
  async searchPatientTreatments(
    searchQuery: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      const data = await this.patientTreatmentRepository.searchPatientTreatments(searchQuery)

      // Apply pagination to results
      const skip = (page - 1) * limit
      const paginatedData = data.slice(skip, skip + limit)

      return {
        data: paginatedData,
        meta: {
          total: data.length,
          page,
          limit,
          totalPages: Math.ceil(data.length / limit),
          hasNextPage: page < Math.ceil(data.length / limit),
          hasPreviousPage: page > 1,
        },
      }
    } catch (error) {
      throw new InternalServerErrorException('Error searching patient treatments')
    }
  }

  // Get patient treatments by date range
  async getPatientTreatmentsByDateRange(startDate: Date, endDate: Date): Promise<PatientTreatment[]> {
    try {
      return await this.patientTreatmentRepository.getPatientTreatmentsByDateRange(startDate, endDate)
    } catch (error) {
      throw new InternalServerErrorException('Error getting patient treatments by date range')
    }
  }

  // Get active patient treatments
  async getActivePatientTreatments(query: any): Promise<PaginatedResponse<PatientTreatment>> {
    try {
      const { page = 1, limit = 10, patientId, doctorId, protocolId } = query

      const params: {
        patientId?: number
        skip?: number
        take?: number
        orderBy?: any
      } = {}
      if (patientId) params.patientId = patientId

      const data = await this.patientTreatmentRepository.getActivePatientTreatments(params)

      // Apply additional filters
      let filteredData = data
      if (doctorId) {
        filteredData = filteredData.filter((treatment) => treatment.doctorId === doctorId)
      }
      if (protocolId) {
        filteredData = filteredData.filter((treatment) => treatment.protocolId === protocolId)
      }

      // Apply pagination
      const skip = (page - 1) * limit
      const paginatedData = filteredData.slice(skip, skip + limit)

      return {
        data: paginatedData,
        meta: {
          total: filteredData.length,
          page,
          limit,
          totalPages: Math.ceil(filteredData.length / limit),
          hasNextPage: page < Math.ceil(filteredData.length / limit),
          hasPreviousPage: page > 1,
        },
      }
    } catch (error) {
      throw new InternalServerErrorException('Error getting active patient treatments')
    }
  }

  // Get active patient treatments by patient
  async getActivePatientTreatmentsByPatient(patientId: number): Promise<any[]> {
    try {
      return await this.patientTreatmentRepository.getActivePatientTreatmentsByPatientId(patientId)
    } catch (error) {
      throw new InternalServerErrorException('Error getting active patient treatments by patient')
    }
  }

  // Get patient treatment by ID
  async getPatientTreatmentById(id: number): Promise<PatientTreatment> {
    try {
      const result = await this.patientTreatmentRepository.findPatientTreatmentById(id)
      if (!result) {
        throw new NotFoundException(`Patient treatment with ID ${id} not found`)
      }
      return result
    } catch (error) {
      throw new InternalServerErrorException('Error getting patient treatment by ID')
    }
  }

  // Update patient treatment
  async updatePatientTreatment(id: number, data: any): Promise<PatientTreatment> {
    try {
      const validatedData = UpdatePatientTreatmentSchema.parse(data)
      return await this.patientTreatmentRepository.updatePatientTreatment(id, validatedData)
    } catch (error) {
      throw new InternalServerErrorException('Error updating patient treatment')
    }
  }

  // Delete patient treatment
  async deletePatientTreatment(id: number): Promise<PatientTreatment> {
    try {
      return await this.patientTreatmentRepository.deletePatientTreatment(id)
    } catch (error) {
      throw new InternalServerErrorException('Error deleting patient treatment')
    }
  }
}
