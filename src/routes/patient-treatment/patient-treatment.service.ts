import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import {
  AddMedicationData,
  CombinedMedication,
  CustomMedicationsData,
  CustomMedicationsDataDto,
  MedicationModification,
  ProtocolMedication,
  RemovedMedication,
  UpdateMedicationData,
} from '../../shared/types'
import {
  BulkUpdateStatusDtoType,
  CreatePatientTreatmentDtoType,
  QueryPatientTreatmentDtoType,
  RecordAdherenceDtoType,
  UpdatePatientTreatmentDtoType,
  UpdateTreatmentStatusDtoType,
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
        customMedications: undefined,
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
  async getAdherenceReports(patientId?: number, _protocolId?: number) {
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

  // Customize medications for specific patient treatment
  async customizeMedications(treatmentId: number, customMedicationsDto: CustomMedicationsDataDto, userId: number) {
    try {
      const existingTreatment = await this.patientTreatmentRepository.findById(treatmentId)
      if (!existingTreatment) {
        throw new NotFoundException('Patient treatment not found')
      }

      // Convert DTO to internal format
      const customMedications = this.convertDtoToCustomMedications(customMedicationsDto, userId)

      const updatedTreatment = await this.patientTreatmentRepository.updateTreatmentMedications(
        treatmentId,
        customMedications,
        userId,
      )

      return {
        success: true,
        data: updatedTreatment,
        message: 'Medications customized successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new BadRequestException('Failed to customize medications')
    }
  }

  // Get customized medications for patient treatment
  async getCustomizedMedications(treatmentId: number) {
    try {
      const treatment = await this.patientTreatmentRepository.getPatientTreatmentWithMedications(treatmentId)
      if (!treatment) {
        throw new NotFoundException('Patient treatment not found')
      }

      return {
        success: true,
        data: {
          treatmentId: treatment.id,
          protocolMedications: treatment.protocol.medicines,
          customMedications: treatment.customMedications,
          combinedMedications: this.combineProtocolAndCustomMedications(
            treatment.protocol.medicines,
            treatment.customMedications as CustomMedicationsData | null,
          ),
        },
        message: 'Customized medications retrieved successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new BadRequestException('Failed to retrieve customized medications')
    }
  }

  // Add additional medication to patient treatment
  async addAdditionalMedication(treatmentId: number, medicationData: AddMedicationData, userId: number) {
    try {
      const treatment = await this.patientTreatmentRepository.findById(treatmentId)
      if (!treatment) {
        throw new NotFoundException('Patient treatment not found')
      }

      const currentCustomMedications = (treatment.customMedications as CustomMedicationsData) || {
        additionalMedications: [],
        modifications: [],
        removedMedications: [],
      }

      // Add new medication to additional medications
      const newMedication = {
        id: Date.now(), // Simple ID generation
        medicineId: medicationData.medicineId,
        dosage: medicationData.dosage,
        frequency: medicationData.frequency,
        duration: medicationData.duration,
        instructions: medicationData.instructions,
        addedBy: userId,
        addedAt: new Date(),
      }

      if (!currentCustomMedications.additionalMedications) {
        currentCustomMedications.additionalMedications = []
      }
      currentCustomMedications.additionalMedications.push(newMedication)

      const updatedTreatment = await this.patientTreatmentRepository.updateTreatmentMedications(
        treatmentId,
        currentCustomMedications,
        userId,
      )

      return {
        success: true,
        data: updatedTreatment,
        message: 'Additional medication added successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new BadRequestException('Failed to add additional medication')
    }
  }

  // Update specific medication in patient treatment
  async updateMedicationInTreatment(
    treatmentId: number,
    medicineId: number,
    updateData: UpdateMedicationData,
    userId: number,
  ) {
    try {
      const treatment = await this.patientTreatmentRepository.findById(treatmentId)
      if (!treatment) {
        throw new NotFoundException('Patient treatment not found')
      }

      const currentCustomMedications = (treatment.customMedications as CustomMedicationsData) || {
        additionalMedications: [],
        modifications: [],
        removedMedications: [],
      }

      // Find and update modification for this medicine
      if (!currentCustomMedications.modifications) {
        currentCustomMedications.modifications = []
      }

      const existingModificationIndex = currentCustomMedications.modifications.findIndex(
        (mod: MedicationModification) => mod.medicineId === medicineId,
      )

      const modification = {
        medicineId,
        dosage: updateData.dosage,
        frequency: updateData.frequency,
        duration: updateData.duration,
        instructions: updateData.instructions,
        modifiedBy: userId,
        modifiedAt: new Date(),
      }

      if (existingModificationIndex >= 0) {
        currentCustomMedications.modifications[existingModificationIndex] = modification
      } else {
        currentCustomMedications.modifications.push(modification)
      }

      const updatedTreatment = await this.patientTreatmentRepository.updateTreatmentMedications(
        treatmentId,
        currentCustomMedications,
        userId,
      )

      return {
        success: true,
        data: updatedTreatment,
        message: 'Medication updated successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new BadRequestException('Failed to update medication')
    }
  }

  // Remove medication from patient treatment
  async removeMedicationFromTreatment(treatmentId: number, medicineId: number, reason: string, userId: number) {
    try {
      const treatment = await this.patientTreatmentRepository.findById(treatmentId)
      if (!treatment) {
        throw new NotFoundException('Patient treatment not found')
      }

      const currentCustomMedications = (treatment.customMedications as CustomMedicationsData) || {
        additionalMedications: [],
        modifications: [],
        removedMedications: [],
      }

      // Mark medication as removed
      if (!currentCustomMedications.removedMedications) {
        currentCustomMedications.removedMedications = []
      }

      const removal = {
        medicineId,
        removedBy: userId,
        removedAt: new Date(),
        reason: reason,
      }

      currentCustomMedications.removedMedications.push(removal)

      const updatedTreatment = await this.patientTreatmentRepository.updateTreatmentMedications(
        treatmentId,
        currentCustomMedications,
        userId,
      )

      return {
        success: true,
        data: updatedTreatment,
        message: 'Medication removed successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new BadRequestException('Failed to remove medication')
    }
  }

  // Helper method to convert DTO to internal CustomMedicationsData format
  private convertDtoToCustomMedications(dto: CustomMedicationsDataDto, userId: number): CustomMedicationsData {
    const result: CustomMedicationsData = {
      additionalMedications: [],
      modifications: [],
      removedMedications: [],
    }

    // Convert additional medications
    if (dto.additionalMedications) {
      result.additionalMedications = dto.additionalMedications.map((med, index) => ({
        id: Date.now() + index, // Simple ID generation
        medicineId: med.medicineId,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
        addedBy: userId,
        addedAt: new Date(),
      }))
    }

    // Convert modifications
    if (dto.modifications) {
      result.modifications = dto.modifications.map((mod) => ({
        medicineId: mod.medicineId,
        dosage: mod.dosage,
        frequency: mod.frequency,
        duration: mod.duration,
        instructions: mod.instructions,
        modifiedBy: userId,
        modifiedAt: new Date(),
      }))
    }

    // Convert removed medications
    if (dto.removedMedications) {
      result.removedMedications = dto.removedMedications.map((rem) => ({
        medicineId: rem.medicineId,
        removedBy: userId,
        removedAt: new Date(),
        reason: rem.reason,
      }))
    }

    return result
  }

  // Helper method to combine protocol and custom medications
  private combineProtocolAndCustomMedications(
    protocolMedications: ProtocolMedication[],
    customMedications: CustomMedicationsData | null,
  ): CombinedMedication[] {
    if (!customMedications)
      return protocolMedications.map((med) => ({
        id: med.id,
        medicineId: med.medicineId,
        dosage: med.dosage,
        duration: med.duration,
        notes: med.notes,
        medicine: med.medicine,
      }))

    let combinedMedications: CombinedMedication[] = protocolMedications.map((med) => ({
      id: med.id,
      medicineId: med.medicineId,
      dosage: med.dosage,
      duration: med.duration,
      notes: med.notes,
      medicine: med.medicine,
    }))

    // Apply modifications
    if (customMedications.modifications) {
      customMedications.modifications.forEach((mod: MedicationModification) => {
        const index = combinedMedications.findIndex((med: CombinedMedication) => med.medicineId === mod.medicineId)
        if (index >= 0) {
          combinedMedications[index] = { ...combinedMedications[index], ...mod }
        }
      })
    }

    // Remove medications marked for removal
    if (customMedications.removedMedications) {
      const removedIds = customMedications.removedMedications.map((rem: RemovedMedication) => rem.medicineId)
      combinedMedications = combinedMedications.filter(
        (med: CombinedMedication) => !removedIds.includes(med.medicineId),
      )
    }

    // Add additional medications
    if (customMedications.additionalMedications) {
      combinedMedications.push(...customMedications.additionalMedications)
    }

    return combinedMedications
  }
}
