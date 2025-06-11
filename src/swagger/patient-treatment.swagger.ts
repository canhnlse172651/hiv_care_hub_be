import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'

// Swagger schemas for Patient Treatment
export const PatientTreatmentResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    patientId: { type: 'number', example: 123 },
    protocolId: { type: 'number', example: 5 },
    doctorId: { type: 'number', example: 10 },
    startDate: { type: 'string', format: 'date', example: '2025-01-01' },
    endDate: { type: 'string', format: 'date', example: '2025-12-31', nullable: true },
    status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'DISCONTINUED'], example: 'ACTIVE' },
    notes: { type: 'string', example: 'Patient responding well to treatment' },
    total: { type: 'number', format: 'decimal', example: 1250.0 },
    customMedications: { type: 'object', nullable: true },
    isActive: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
    protocol: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 5 },
        name: { type: 'string', example: 'Standard HIV Treatment Protocol' },
        targetDisease: { type: 'string', example: 'HIV' },
      },
    },
  },
}

export const PatientTreatmentStatsSchema = {
  type: 'object',
  properties: {
    totalTreatments: { type: 'number', example: 25 },
    activeTreatments: { type: 'number', example: 15 },
    completedTreatments: { type: 'number', example: 8 },
    discontinuedTreatments: { type: 'number', example: 2 },
    averageDuration: { type: 'number', example: 180 },
    adherenceRate: { type: 'number', format: 'decimal', example: 85.5 },
  },
}

export const CustomMedicationSchema = {
  type: 'object',
  properties: {
    additionalMedications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          medicineId: { type: 'number', example: 15 },
          dosage: { type: 'string', example: '200mg' },
          frequency: { type: 'string', example: 'twice daily' },
          duration: { type: 'string', example: '6 months' },
          instructions: { type: 'string', example: 'Take with food' },
        },
      },
    },
    modifications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          medicineId: { type: 'number', example: 10 },
          dosage: { type: 'string', example: '400mg' },
          frequency: { type: 'string', example: 'once daily' },
          duration: { type: 'string', example: '12 months' },
          instructions: { type: 'string', example: 'Modified dosage due to side effects' },
        },
      },
    },
    removedMedications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          medicineId: { type: 'number', example: 8 },
          reason: { type: 'string', example: 'Adverse reaction' },
        },
      },
    },
  },
}

export const CreatePatientTreatmentBodySchema = {
  type: 'object',
  required: ['patientId', 'protocolId', 'startDate'],
  properties: {
    patientId: { type: 'number', example: 123, description: 'ID of the patient' },
    protocolId: { type: 'number', example: 5, description: 'ID of the treatment protocol' },
    startDate: { type: 'string', format: 'date', example: '2025-01-01' },
    endDate: { type: 'string', format: 'date', example: '2025-12-31', nullable: true },
    notes: { type: 'string', example: 'Initial treatment notes' },
  },
}

export const UpdatePatientTreatmentBodySchema = {
  type: 'object',
  properties: {
    endDate: { type: 'string', format: 'date', example: '2025-12-31' },
    notes: { type: 'string', example: 'Updated treatment notes' },
  },
}

export const RecordAdherenceBodySchema = {
  type: 'object',
  properties: {
    notes: { type: 'string', example: 'Patient missed 2 doses this week' },
  },
}

export const UpdateTreatmentStatusBodySchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'DISCONTINUED'], example: 'COMPLETED' },
  },
}

export const BulkUpdateStatusBodySchema = {
  type: 'object',
  required: ['treatmentIds', 'status'],
  properties: {
    treatmentIds: {
      type: 'array',
      items: { type: 'number' },
      example: [1, 2, 3, 4],
    },
    status: { type: 'string', enum: ['COMPLETED', 'DISCONTINUED'], example: 'COMPLETED' },
  },
}

// Decorators
export const ApiCreatePatientTreatment = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new patient treatment' }),
    ApiBody({ schema: CreatePatientTreatmentBodySchema }),
    ApiResponse({
      status: 201,
      description: 'Patient treatment created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: PatientTreatmentResponseSchema,
          message: { type: 'string', example: 'Patient treatment created successfully' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation failed' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' }),
  )
}

export const ApiGetAllPatientTreatments = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all patient treatments with filtering and pagination' }),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiQuery({ name: 'search', required: false, type: 'string', example: 'HIV' }),
    ApiQuery({ name: 'patientId', required: false, type: 'number', example: 123 }),
    ApiQuery({ name: 'protocolId', required: false, type: 'number', example: 5 }),
    ApiQuery({ name: 'isActive', required: false, type: 'boolean', example: true }),
    ApiResponse({
      status: 200,
      description: 'Patient treatments retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: PatientTreatmentResponseSchema,
          },
          pagination: {
            type: 'object',
            properties: {
              currentPage: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 3 },
              totalItems: { type: 'number', example: 25 },
              itemsPerPage: { type: 'number', example: 10 },
            },
          },
          message: { type: 'string', example: 'Patient treatments retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiGetPatientTreatmentById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get patient treatment by ID' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Patient treatment retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: PatientTreatmentResponseSchema,
          message: { type: 'string', example: 'Patient treatment retrieved successfully' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Patient treatment not found' }),
  )
}

export const ApiGetTreatmentsByPatient = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get treatments by patient ID' }),
    ApiParam({ name: 'patientId', type: 'number', example: 123 }),
    ApiResponse({
      status: 200,
      description: 'Patient treatments retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: PatientTreatmentResponseSchema,
          },
          message: { type: 'string', example: 'Patient treatments retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiGetAdherenceReports = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get adherence reports' }),
    ApiQuery({ name: 'patientId', required: false, type: 'number', example: 123 }),
    ApiQuery({ name: 'protocolId', required: false, type: 'number', example: 5 }),
    ApiResponse({
      status: 200,
      description: 'Adherence reports retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: PatientTreatmentStatsSchema,
          message: { type: 'string', example: 'Adherence reports retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiUpdatePatientTreatment = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update patient treatment' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiBody({ schema: UpdatePatientTreatmentBodySchema }),
    ApiResponse({
      status: 200,
      description: 'Patient treatment updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: PatientTreatmentResponseSchema,
          message: { type: 'string', example: 'Patient treatment updated successfully' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Patient treatment not found' }),
  )
}

export const ApiUpdateTreatmentStatus = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update treatment status' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiBody({ schema: UpdateTreatmentStatusBodySchema }),
    ApiResponse({
      status: 200,
      description: 'Treatment status updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Treatment status updated successfully' },
        },
      },
    }),
  )
}

export const ApiRecordAdherence = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Record patient adherence' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiBody({ schema: RecordAdherenceBodySchema }),
    ApiResponse({
      status: 200,
      description: 'Adherence recorded successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: PatientTreatmentResponseSchema,
          message: { type: 'string', example: 'Adherence recorded successfully' },
        },
      },
    }),
  )
}

export const ApiCustomizeMedications = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Customize medications for patient treatment' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['customMedications'],
        properties: {
          customMedications: CustomMedicationSchema,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Medications customized successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: PatientTreatmentResponseSchema,
          message: { type: 'string', example: 'Medications customized successfully' },
        },
      },
    }),
  )
}

export const ApiBulkUpdateStatus = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Bulk update treatment status' }),
    ApiBody({ schema: BulkUpdateStatusBodySchema }),
    ApiResponse({
      status: 200,
      description: 'Treatment statuses updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              updatedCount: { type: 'number', example: 3 },
            },
          },
          message: { type: 'string', example: '3 treatments updated successfully' },
        },
      },
    }),
  )
}

export const ApiDeletePatientTreatment = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete patient treatment (soft delete)' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Patient treatment deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Patient treatment deleted successfully' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Patient treatment not found' }),
  )
}

export const ApiRestorePatientTreatment = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Restore deleted patient treatment' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Patient treatment restored successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: PatientTreatmentResponseSchema,
          message: { type: 'string', example: 'Patient treatment restored successfully' },
        },
      },
    }),
  )
}
