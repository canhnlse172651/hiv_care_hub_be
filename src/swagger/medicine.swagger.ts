import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'

// Swagger schemas for Medicine
export const MedicineResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    name: { type: 'string', example: 'Efavirenz' },
    description: { type: 'string', example: 'Antiretroviral medication for HIV treatment' },
    unit: { type: 'string', example: 'tablet' },
    price: { type: 'number', format: 'decimal', example: 25.5 },
    manufacturer: { type: 'string', example: 'Pharma Corp' },
    category: { type: 'string', example: 'Antiretroviral' },
    isActive: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
  },
}

export const MedicineUsageStatsSchema = {
  type: 'object',
  properties: {
    medicineId: { type: 'number', example: 1 },
    totalUsage: { type: 'number', example: 150 },
    activeProtocols: { type: 'number', example: 25 },
    activeTreatments: { type: 'number', example: 75 },
    lastUsed: { type: 'string', format: 'date-time' },
  },
}

export const CreateMedicineBodySchema = {
  type: 'object',
  required: ['name', 'unit', 'price'],
  properties: {
    name: { type: 'string', example: 'Efavirenz', description: 'Medicine name' },
    description: { type: 'string', example: 'Antiretroviral medication for HIV treatment' },
    unit: { type: 'string', example: 'tablet', description: 'Unit of measurement' },
    price: { type: 'number', format: 'decimal', example: 25.5, description: 'Price per unit' },
    manufacturer: { type: 'string', example: 'Pharma Corp' },
    category: { type: 'string', example: 'Antiretroviral' },
  },
}

export const UpdateMedicineBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', example: 'Efavirenz' },
    description: { type: 'string', example: 'Updated description' },
    unit: { type: 'string', example: 'tablet' },
    price: { type: 'number', format: 'decimal', example: 30.0 },
    manufacturer: { type: 'string', example: 'New Pharma Corp' },
    category: { type: 'string', example: 'Antiretroviral' },
  },
}

export const BulkUpdatePricesBodySchema = {
  type: 'object',
  required: ['medicines'],
  properties: {
    medicines: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'price'],
        properties: {
          id: { type: 'number', example: 1 },
          price: { type: 'number', format: 'decimal', example: 30.0 },
        },
      },
    },
  },
}

// Decorators
export const ApiCreateMedicine = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new medicine' }),
    ApiBody({ schema: CreateMedicineBodySchema }),
    ApiResponse({
      status: 201,
      description: 'Medicine created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: MedicineResponseSchema,
          message: { type: 'string', example: 'Medicine created successfully' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation failed' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' }),
  )
}

export const ApiGetAllMedicines = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all medicines with filtering and pagination' }),
    ApiQuery({ name: 'page', required: false, type: 'number', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 }),
    ApiQuery({ name: 'search', required: false, type: 'string', example: 'efavirenz' }),
    ApiQuery({ name: 'category', required: false, type: 'string', example: 'Antiretroviral' }),
    ApiQuery({ name: 'manufacturer', required: false, type: 'string', example: 'Pharma Corp' }),
    ApiQuery({ name: 'minPrice', required: false, type: 'number', example: 10 }),
    ApiQuery({ name: 'maxPrice', required: false, type: 'number', example: 100 }),
    ApiResponse({
      status: 200,
      description: 'Medicines retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: MedicineResponseSchema,
          },
          pagination: {
            type: 'object',
            properties: {
              currentPage: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 5 },
              totalItems: { type: 'number', example: 50 },
              itemsPerPage: { type: 'number', example: 10 },
            },
          },
          message: { type: 'string', example: 'Medicines retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiSearchMedicines = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Search medicines by name or description' }),
    ApiParam({ name: 'searchTerm', type: 'string', example: 'efavirenz' }),
    ApiResponse({
      status: 200,
      description: 'Search results retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: MedicineResponseSchema,
          },
          message: { type: 'string', example: 'Search results retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiGetMedicineById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get medicine by ID' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Medicine retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: MedicineResponseSchema,
          message: { type: 'string', example: 'Medicine retrieved successfully' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Medicine not found' }),
  )
}

export const ApiGetMedicineUsageStats = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get medicine usage statistics' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Usage statistics retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: MedicineUsageStatsSchema,
          message: { type: 'string', example: 'Usage statistics retrieved successfully' },
        },
      },
    }),
  )
}

export const ApiUpdateMedicine = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update medicine' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiBody({ schema: UpdateMedicineBodySchema }),
    ApiResponse({
      status: 200,
      description: 'Medicine updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: MedicineResponseSchema,
          message: { type: 'string', example: 'Medicine updated successfully' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Medicine not found' }),
  )
}

export const ApiBulkUpdatePrices = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Bulk update medicine prices' }),
    ApiBody({ schema: BulkUpdatePricesBodySchema }),
    ApiResponse({
      status: 200,
      description: 'Prices updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              updatedCount: { type: 'number', example: 5 },
            },
          },
          message: { type: 'string', example: '5 medicine prices updated successfully' },
        },
      },
    }),
  )
}

export const ApiDeleteMedicine = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete medicine (soft delete)' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Medicine deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Medicine deleted successfully' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Medicine not found' }),
  )
}

export const ApiRestoreMedicine = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Restore deleted medicine' }),
    ApiParam({ name: 'id', type: 'number', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Medicine restored successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: MedicineResponseSchema,
          message: { type: 'string', example: 'Medicine restored successfully' },
        },
      },
    }),
  )
}
