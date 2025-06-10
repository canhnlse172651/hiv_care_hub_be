import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import {
  CreatePatientTreatmentDtoType,
  UpdatePatientTreatmentDtoType,
  QueryPatientTreatmentDtoType,
  UpdateTreatmentStatusDtoType,
  RecordAdherenceDtoType,
  BulkUpdateStatusDtoType,
} from './patient-treatment.dto'

@Injectable()
export class PatientTreatmentService {
  constructor(private readonly patientTreatmentRepository: PatientTreatmentRepository) {}

  // Create new patient treatment
  async createTreatment(data: CreatePatientTreatmentDtoType, userId: number) {
    try {
      // Create treatment data with required fields from repository
      const treatmentData = {
        patientId: data.patientId,
        protocolId: data.protocolId,
        doctorId: userId, // Assuming the creating user is the doctor
        notes: data.notes,
        startDate: data.startDate,
        endDate: data.endDate,
        total: 0, // Will be calculated based on protocol medicines
        customMedications: null,
      }

      const treatment = await this.patientTreatmentRepository.createPatientTreatment(treatmentData, userId)
      return {
        success: true,
        data: treatment,
        message: 'Patient treatment created successfully',
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message)
      }
      throw new BadRequestException('Failed to create patient treatment')
    }
  }

  // Get all treatments with filtering and pagination
  async getAllTreatments(query: QueryPatientTreatmentDtoType) {
    try {
      const filters = {
        patientId: query.patientId,
        protocolId: query.protocolId,
        isActive: query.isActive,
      }

      const paginationOptions = {
        page: query.page || 1,
        limit: query.limit || 10,
        search: query.search,
      }

      const result = await this.patientTreatmentRepository.findWithAdvancedFiltering(paginationOptions, filters)
      return {
        success: true,
        data: result.data,
        pagination: {
          currentPage: query.page || 1,
          totalPages: result.meta.totalPages,
          totalItems: result.meta.total,
          itemsPerPage: query.limit || 10,
        },
        message: 'Patient treatments retrieved successfully',
      }
    } catch (error) {
      throw new BadRequestException('Failed to retrieve patient treatments')
    }
  }

  // Get treatment by ID
  async getTreatmentById(id: number) {
    try {
      const treatment = await this.patientTreatmentRepository.getTreatmentWithDetails(id)
      if (!treatment) {
        throw new NotFoundException('Patient treatment not found')
      }
      return {
        success: true,
        data: treatment,
        message: 'Patient treatment retrieved successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to retrieve patient treatment')
    }
  }

  // Get treatments by patient ID
  async getTreatmentsByPatient(patientId: number) {
    try {
      const treatments = await this.patientTreatmentRepository.findMany({ patientId })
      return {
        success: true,
        data: treatments,
        message: 'Patient treatments retrieved successfully',
      }
    } catch (error) {
      throw new BadRequestException('Failed to retrieve patient treatments')
    }
  }

  // Get active treatments by patient ID
  async getActiveTreatmentsByPatient(patientId: number) {
    try {
      const treatments = await this.patientTreatmentRepository.findActiveByPatient(patientId)
      return {
        success: true,
        data: treatments,
        message: 'Active patient treatments retrieved successfully',
      }
    } catch (error) {
      throw new BadRequestException('Failed to retrieve active patient treatments')
    }
  }

  // Get treatments by protocol ID
  async getTreatmentsByProtocol(protocolId: number) {
    try {
      const treatments = await this.patientTreatmentRepository.findByProtocol(protocolId)
      return {
        success: true,
        data: treatments,
        message: 'Protocol treatments retrieved successfully',
      }
    } catch (error) {
      throw new BadRequestException('Failed to retrieve protocol treatments')
    }
  }

  // Update treatment
  async updateTreatment(id: number, data: UpdatePatientTreatmentDtoType, userId: number) {
    try {
      const existingTreatment = await this.patientTreatmentRepository.findById(id)
      if (!existingTreatment) {
        throw new NotFoundException('Patient treatment not found')
      }

      const updateData = {
        notes: data.notes,
        endDate: data.endDate,
      }

      const treatment = await this.patientTreatmentRepository.update(id, updateData, userId)
      return {
        success: true,
        data: treatment,
        message: 'Patient treatment updated successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to update patient treatment')
    }
  }

  // Update treatment status
  async updateTreatmentStatus(id: number, data: UpdateTreatmentStatusDtoType, userId: number) {
    try {
      const existingTreatment = await this.patientTreatmentRepository.findById(id)
      if (!existingTreatment) {
        throw new NotFoundException('Patient treatment not found')
      }

      if (data.status === 'COMPLETED' || data.status === 'DISCONTINUED') {
        await this.patientTreatmentRepository.completeTreatment(id, userId)
      }

      return {
        success: true,
        message: 'Treatment status updated successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to update treatment status')
    }
  }

  // Record adherence
  async recordAdherence(id: number, data: RecordAdherenceDtoType, userId: number) {
    try {
      const existingTreatment = await this.patientTreatmentRepository.findById(id)
      if (!existingTreatment) {
        throw new NotFoundException('Patient treatment not found')
      }

      const updateData = {
        notes: data.notes,
      }

      const treatment = await this.patientTreatmentRepository.update(id, updateData, userId)
      return {
        success: true,
        data: treatment,
        message: 'Adherence recorded successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to record adherence')
    }
  }

  // Get adherence reports
  async getAdherenceReports(patientId?: number, protocolId?: number) {
    try {
      if (patientId) {
        const stats = await this.patientTreatmentRepository.getPatientTreatmentStats(patientId)
        return {
          success: true,
          data: stats,
          message: 'Adherence reports retrieved successfully',
        }
      }

      return {
        success: true,
        data: [],
        message: 'No adherence reports found',
      }
    } catch (error) {
      throw new BadRequestException('Failed to retrieve adherence reports')
    }
  }

  // Get treatment statistics
  async getTreatmentStatistics(patientId?: number, protocolId?: number) {
    try {
      if (patientId) {
        const stats = await this.patientTreatmentRepository.getPatientTreatmentStats(patientId)
        return {
          success: true,
          data: stats,
          message: 'Treatment statistics retrieved successfully',
        }
      }

      return {
        success: true,
        data: {},
        message: 'No statistics available',
      }
    } catch (error) {
      throw new BadRequestException('Failed to retrieve treatment statistics')
    }
  }

  // Bulk update status
  async bulkUpdateStatus(data: BulkUpdateStatusDtoType, userId: number) {
    try {
      let updatedCount = 0

      for (const treatmentId of data.treatmentIds) {
        try {
          if (data.status === 'COMPLETED' || data.status === 'DISCONTINUED') {
            await this.patientTreatmentRepository.completeTreatment(treatmentId, userId)
            updatedCount++
          }
        } catch (error) {
          // Continue with other treatments even if one fails
          console.error(`Failed to update treatment ${treatmentId}:`, error)
        }
      }

      return {
        success: true,
        data: { updatedCount },
        message: `${updatedCount} treatments updated successfully`,
      }
    } catch (error) {
      throw new BadRequestException('Failed to bulk update treatment status')
    }
  }

  // Delete treatment (soft delete)
  async deleteTreatment(id: number) {
    try {
      const existingTreatment = await this.patientTreatmentRepository.findById(id)
      if (!existingTreatment) {
        throw new NotFoundException('Patient treatment not found')
      }

      await this.patientTreatmentRepository.delete(id)
      return {
        success: true,
        message: 'Patient treatment deleted successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to delete patient treatment')
    }
  }

  // Restore deleted treatment
  async restoreTreatment(id: number) {
    try {
      const result = await this.patientTreatmentRepository.restore(id)
      if (!result) {
        throw new NotFoundException('Patient treatment not found or not deleted')
      }

      return {
        success: true,
        data: result,
        message: 'Patient treatment restored successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to restore patient treatment')
    }
  }
}
