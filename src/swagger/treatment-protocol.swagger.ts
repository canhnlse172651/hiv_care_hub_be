import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'

// Swagger schemas for Treatment Protocol
export const TreatmentProtocolResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    name: { type: 'string', example: 'Standard HIV Treatment Protocol' },
    description: { type: 'string', example: 'Comprehensive HIV treatment protocol for newly diagnosed patients' },
    targetDisease: { type: 'string', example: 'HIV' },
    duration: { type: 'string', example: '12 months' },
    doctorId: { type: 'number', example: 10 },
    isActive: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
    medicines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          medicineId: { type: 'number', example: 5 },
          dosage: { type: 'string', example: '600mg' },
          duration: { type: 'string', example: '12 months' },
          notes: { type: 'string', example: 'Take with food' },
          medicine: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 5 },
              name: { type: 'string', example: 'Efavirenz' },
              unit: { type: 'string', example: 'tablet' },
              price: { type: 'number', format: 'decimal', example: 25.5 },
            },
          },
        },
      },
    },
  },
}

export const ProtocolUsageStatsSchema = {
  type: 'object',
  properties: {
    protocolId: { type: 'number', example: 1 },
    totalUsage: { type: 'number', example: 150 },
    activeTreatments: { type: 'number', example: 75 },
    completedTreatments: { type: 'number', example: 60 },
    discontinuedTreatments: { type: 'number', example: 15 },
    averageSuccessRate: { type: 'number', format: 'decimal', example: 85.5 },
    lastUsed: { type: 'string', format: 'date-time' },
  },
}

export const PopularProtocolSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    name: { type: 'string', example: 'Standard HIV Treatment Protocol' },
    targetDisease: { type: 'string', example: 'HIV' },
    usageCount: { type: 'number', example: 150 },
    successRate: { type: 'number', format: 'decimal', example: 85.5 },
  },
}

export const CreateTreatmentProtocolBodySchema = {
  type: 'object',
  required: ['name', 'targetDisease', 'duration'],
  properties: {
    name: { type: 'string', example: 'Standard HIV Treatment Protocol', description: 'Protocol name' },
    description: { type: 'string', example: 'Comprehensive HIV treatment protocol for newly diagnosed patients' },
    targetDisease: { type: 'string', example: 'HIV', description: 'Target disease for this protocol' },
    duration: { type: 'string', example: '12 months', description: 'Expected treatment duration' },
    medicines: {
      type: 'array',
      items: {
        type: 'object',
        required: ['medicineId', 'dosage'],
        properties: {
          medicineId: { type: 'number', example: 5 },
          dosage: { type: 'string', example: '600mg' },
          duration: { type: 'string', example: '12 months' },
          notes: { type: 'string', example: 'Take with food' },
        },
      },
    },
  },
}

export const UpdateTreatmentProtocolBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', example: 'Updated HIV Treatment Protocol' },
    description: { type: 'string', example: 'Updated protocol description' },
    targetDisease: { type: 'string', example: 'HIV' },
    duration: { type: 'string', example: '18 months' },
  },
}

export const AddMedicineToProtocolBodySchema = {
  type: 'object',
  required: ['medicineId', 'dosage'],
  properties: {
    medicineId: { type: 'number', example: 8, description: 'ID of the medicine to add' },
    dosage: { type: 'string', example: '200mg', description: 'Dosage instruction' },
    duration: { type: 'string', example: '6 months', description: 'Duration for this medicine' },
    notes: { type: 'string', example: 'Take twice daily with meals' },
  },
}

export const UpdateMedicineInProtocolBodySchema = {
  type: 'object',
  properties: {
    dosage: { type: 'string', example: '400mg' },
    duration: { type: 'string', example: '9 months' },
    notes: { type: 'string', example: 'Updated dosage due to patient response' },
  },
}

export const CloneProtocolBodySchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', example: 'Cloned HIV Treatment Protocol V2', description: 'Name for the cloned protocol' },
    description: { type: 'string', example: 'Modified version of the original protocol' },
  },
}

// Decorators
export const ApiCreateTreatmentProtocol = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new treatment protocol' }),
    ApiBody({ schema: CreateTreatmentProtocolBodySchema }),
    ApiResponse({
      status: 201,
      description: 'Treatment protocol created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: TreatmentProtocolResponseSchema,
          message: { type: 'string', example: 'Treatment protocol created successfully' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation failed' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' }),
  )
}

export const ApiGetAllTreatmentProtocols = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all treatment protocols with filtering and pagination' }),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiQuery({ name: 'search', required: false, type: 'string', example: 'HIV' }),
    ApiQuery({ name: 'targetDisease', required: false, type: 'string', example: 'HIV' }),
    ApiQuery({ name: 'doctorId', required: false, type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Treatment protocols retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: TreatmentProtocolResponseSchema,
          },
          pagination: {
            type: 'object',
            properties: {
              currentPage: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 2 },
              totalItems: { type: 'number', example: 15 },
              itemsPerPage: { type: 'number', example: 10 },
            },
          },
          message: { type: 'string', example: 'Treatment protocols retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiGetProtocolsByTargetDisease = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get protocols by target disease' }),
    ApiParam({ name: 'targetDisease', type: 'string', example: 'HIV' }),
    ApiResponse({
      status: 200,
      description: 'Protocols filtered by target disease',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: TreatmentProtocolResponseSchema,
          },
          message: { type: 'string', example: 'Protocols retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiGetProtocolsByDoctor = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get protocols created by specific doctor' }),
    ApiParam({ name: 'doctorId', type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Protocols created by doctor retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: TreatmentProtocolResponseSchema,
          },
          message: { type: 'string', example: 'Doctor protocols retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiGetMostPopularProtocols = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get most popular treatment protocols' }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Most popular protocols retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: PopularProtocolSchema,
          },
          message: { type: 'string', example: 'Most popular protocols retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiGetTreatmentProtocolById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get treatment protocol by ID' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Treatment protocol retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: TreatmentProtocolResponseSchema,
          message: { type: 'string', example: 'Treatment protocol retrieved successfully' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Treatment protocol not found' }),
  )
}

export const ApiGetProtocolUsageStats = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get protocol usage statistics' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Usage statistics retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: ProtocolUsageStatsSchema,
          message: { type: 'string', example: 'Usage statistics retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiUpdateTreatmentProtocol = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update treatment protocol' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiBody({ schema: UpdateTreatmentProtocolBodySchema }),
    ApiResponse({
      status: 200,
      description: 'Treatment protocol updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: TreatmentProtocolResponseSchema,
          message: { type: 'string', example: 'Treatment protocol updated successfully' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Treatment protocol not found' }),
  )
}

export const ApiAddMedicineToProtocol = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Add medicine to protocol' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiBody({ schema: AddMedicineToProtocolBodySchema }),
    ApiResponse({
      status: 201,
      description: 'Medicine added to protocol successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: TreatmentProtocolResponseSchema,
          message: { type: 'string', example: 'Medicine added to protocol successfully' },
        },
      },
    }),
  )
}

export const ApiUpdateMedicineInProtocol = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update medicine in protocol' }),
    ApiParam({ name: 'protocolId', type: 'number', example: 1 }),
    ApiParam({ name: 'medicineId', type: 'number', example: 5 }),
    ApiBody({ schema: UpdateMedicineInProtocolBodySchema }),
    ApiResponse({
      status: 200,
      description: 'Medicine in protocol updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: TreatmentProtocolResponseSchema,
          message: { type: 'string', example: 'Medicine updated successfully' },
        },
      },
    }),
  )
}

export const ApiRemoveMedicineFromProtocol = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Remove medicine from protocol' }),
    ApiParam({ name: 'protocolId', type: 'number', example: 1 }),
    ApiParam({ name: 'medicineId', type: 'number', example: 5 }),
    ApiResponse({
      status: 200,
      description: 'Medicine removed from protocol successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Medicine removed from protocol successfully' },
        },
      },
    }),
  )
}

export const ApiCloneProtocol = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Clone existing protocol' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiBody({ schema: CloneProtocolBodySchema }),
    ApiResponse({
      status: 201,
      description: 'Protocol cloned successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: TreatmentProtocolResponseSchema,
          message: { type: 'string', example: 'Protocol cloned successfully' },
        },
      },
    }),
  )
}

export const ApiDeleteTreatmentProtocol = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete treatment protocol (soft delete)' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Treatment protocol deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Treatment protocol deleted successfully' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Treatment protocol not found' }),
  )
}

export const ApiRestoreTreatmentProtocol = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Restore deleted protocol' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Protocol restored successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: TreatmentProtocolResponseSchema,
          message: { type: 'string', example: 'Protocol restored successfully' },
        },
      },
    }),
  )
}
