import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'

export const TestResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    name: { type: 'string', example: 'HIV Ag/Ab Combo' },
    description: { type: 'string', example: 'Xét nghiệm sàng lọc HIV kháng nguyên/kháng thể' },
    method: { type: 'string', example: 'Chemiluminescence Immunoassay (CLIA)' },
    category: { type: 'string', enum: ['GENERAL', 'STD', 'HEPATITIS', 'IMMUNOLOGY'], example: 'STD' },
    isQuantitative: { type: 'boolean', example: false },
    unit: { type: 'string', nullable: true, example: null },
    cutOffValue: { type: 'number', nullable: true, example: null },
    price: { type: 'number', example: 250000.0 },
    createdAt: { type: 'string', format: 'date-time', example: '2025-07-14T10:00:00Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2025-07-14T10:00:00Z' },
  },
}

export const ApiCreateTest = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create new test type', description: 'Create a new test type for laboratory testing' }),
    ApiBody({
      description: 'Test data',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Test name', example: 'HIV Ag/Ab Combo' },
          description: {
            type: 'string',
            description: 'Test description',
            example: 'Xét nghiệm sàng lọc HIV kháng nguyên/kháng thể',
          },
          method: { type: 'string', description: 'Test method', example: 'Chemiluminescence Immunoassay (CLIA)' },
          category: {
            type: 'string',
            enum: ['GENERAL', 'STD', 'HEPATITIS', 'IMMUNOLOGY'],
            description: 'Test category',
            example: 'STD',
          },
          isQuantitative: { type: 'boolean', description: 'Is quantitative test', example: false },
          unit: { type: 'string', description: 'Unit of measurement', example: 'COI' },
          cutOffValue: { type: 'number', description: 'Cut-off value for quantitative tests', example: 1.0 },
          price: { type: 'number', description: 'Test price', example: 250000.0 },
        },
        required: ['name', 'price'],
      },
    }),
    ApiResponse({ status: 201, description: 'Test created successfully', schema: TestResponseSchema }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiGetTests = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all tests', description: 'Get all test types with pagination and filtering' }),
    ApiQuery({ name: 'page', type: 'number', description: 'Page number', example: 1, required: false }),
    ApiQuery({ name: 'limit', type: 'number', description: 'Items per page', example: 10, required: false }),
    ApiQuery({ name: 'search', type: 'string', description: 'Search in name or description', required: false }),
    ApiQuery({
      name: 'category',
      type: 'string',
      description: 'Filter by category',
      enum: ['GENERAL', 'STD', 'HEPATITIS', 'IMMUNOLOGY'],
      required: false,
    }),
    ApiQuery({
      name: 'isQuantitative',
      type: 'boolean',
      description: 'Filter by quantitative/qualitative',
      required: false,
    }),
    ApiQuery({
      name: 'sortBy',
      type: 'string',
      description: 'Sort by field',
      enum: ['id', 'name', 'category', 'price', 'createdAt'],
      required: false,
    }),
    ApiQuery({
      name: 'sortOrder',
      type: 'string',
      description: 'Sort order',
      enum: ['asc', 'desc'],
      required: false,
    }),
    ApiResponse({
      status: 200,
      description: 'Tests retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: TestResponseSchema },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  )
}

export const ApiGetTestById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get test by ID', description: 'Get test details by ID' }),
    ApiParam({ name: 'id', type: 'number', description: 'Test ID', example: 1 }),
    ApiResponse({ status: 200, description: 'Test retrieved successfully', schema: TestResponseSchema }),
    ApiResponse({ status: 404, description: 'Test not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  )
}

export const ApiUpdateTest = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update test', description: 'Update test information' }),
    ApiParam({ name: 'id', type: 'number', description: 'Test ID', example: 1 }),
    ApiBody({
      description: 'Test data to update',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Test name', example: 'HIV Ag/Ab Combo' },
          description: { type: 'string', description: 'Test description', example: 'Updated description' },
          method: { type: 'string', description: 'Test method', example: 'Updated method' },
          category: {
            type: 'string',
            enum: ['GENERAL', 'STD', 'HEPATITIS', 'IMMUNOLOGY'],
            description: 'Test category',
          },
          isQuantitative: { type: 'boolean', description: 'Is quantitative test' },
          unit: { type: 'string', description: 'Unit of measurement' },
          cutOffValue: { type: 'number', description: 'Cut-off value' },
          price: { type: 'number', description: 'Test price', example: 270000.0 },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Test updated successfully', schema: TestResponseSchema }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 404, description: 'Test not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiDeleteTest = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete test', description: 'Delete test from system' }),
    ApiParam({ name: 'id', type: 'number', description: 'Test ID', example: 1 }),
    ApiResponse({ status: 200, description: 'Test deleted successfully' }),
    ApiResponse({ status: 404, description: 'Test not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}
