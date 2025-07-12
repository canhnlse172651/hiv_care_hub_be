import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'

const unitEnum = ['mg', 'g', 'ml', 'tablet', 'capsule', 'drops', 'syrup', 'injection']
const sortOrderEnum = ['asc', 'desc']
const sortByEnum = ['name', 'price', 'createdAt', 'unit']
const groupByEnum = ['unit', 'price', 'date']
const usageSortByEnum = ['count', 'totalValue', 'averagePrice']

export const ApiGetAllMedicines = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all medicines',
      description: 'Retrieve a paginated list of all medicines with optional filtering',
    }),
    ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number, example: 10 }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search query for medicine name or description',
      type: String,
      example: 'efavirenz',
    }),
    ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by', enum: sortByEnum, example: 'name' }),
    ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter', type: Number, example: 10 }),
    ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter', type: Number, example: 100 }),
    ApiQuery({ name: 'unit', required: false, description: 'Filter by unit type', enum: unitEnum, example: 'mg' }),
    ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order', enum: sortOrderEnum, example: 'asc' }),
    ApiResponse({ status: 200, description: 'Medicines retrieved successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiGetMedicineById = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get medicine by ID', description: 'Retrieve a specific medicine by its ID' }),
    ApiParam({ name: 'id', description: 'Medicine ID', type: Number, example: 1 }),
    ApiResponse({ status: 200, description: 'Medicine retrieved successfully' }),
    ApiResponse({ status: 404, description: 'Medicine not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiCreateMedicine = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create new medicine', description: 'Create a new medicine entry' }),
    ApiBody({
      description: 'Medicine data',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Medicine name', example: 'Efavirenz' },
          description: {
            type: 'string',
            description: 'Medicine description',
            example: 'Antiretroviral medication for HIV treatment',
          },
          unit: { type: 'string', description: 'Medicine unit', enum: unitEnum, example: 'mg' },
          dose: { type: 'string', description: 'Medicine dose', example: '600mg' },
          price: { type: 'number', description: 'Medicine price', minimum: 0.01, maximum: 999999.99, example: 25.5 },
        },
        required: ['name', 'unit', 'dose', 'price'],
      },
      examples: {
        example: {
          summary: 'Create Medicine',
          value: {
            name: 'Efavirenz',
            description: 'Antiretroviral medication for HIV treatment',
            unit: 'mg',
            dose: '600mg',
            price: 25.5,
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Medicine created successfully' }),
    ApiResponse({ status: 409, description: 'Medicine with this name already exists' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiUpdateMedicine = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update medicine', description: 'Update an existing medicine' }),
    ApiParam({ name: 'id', description: 'Medicine ID', type: Number, example: 1 }),
    ApiBody({
      description: 'Updated medicine data',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Medicine name', example: 'Efavirenz' },
          description: {
            type: 'string',
            description: 'Medicine description',
            example: 'Antiretroviral medication for HIV treatment',
          },
          unit: { type: 'string', description: 'Medicine unit', enum: unitEnum, example: 'mg' },
          dose: { type: 'string', description: 'Medicine dose', example: '600mg' },
          price: { type: 'number', description: 'Medicine price', minimum: 0.01, maximum: 999999.99, example: 25.5 },
        },
      },
      examples: {
        example: {
          summary: 'Update Medicine',
          value: {
            name: 'Efavirenz (Updated)',
            description: 'Antiretroviral medication for HIV treatment - Updated formula',
            unit: 'mg',
            dose: '600mg',
            price: 27.5,
          },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Medicine updated successfully' }),
    ApiResponse({ status: 404, description: 'Medicine not found' }),
    ApiResponse({ status: 409, description: 'Medicine with this name already exists' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiDeleteMedicine = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete medicine', description: 'Delete an existing medicine' }),
    ApiParam({ name: 'id', description: 'Medicine ID', type: Number, example: 1 }),
    ApiResponse({ status: 200, description: 'Medicine deleted successfully' }),
    ApiResponse({ status: 404, description: 'Medicine not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiSearchMedicines = () =>
  applyDecorators(
    ApiOperation({ summary: 'Search medicines', description: 'Search medicines by name or description' }),
    ApiQuery({ name: 'q', description: 'Search query', type: String, required: true, example: 'efavirenz' }),
    ApiResponse({ status: 200, description: 'Medicines found successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiGetMedicineStats = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get medicine statistics',
      description: 'Retrieve statistical data about medicines including counts, usage patterns, and analysis',
    }),
    ApiQuery({
      name: 'includeInactive',
      required: false,
      description: 'Include inactive medicines in statistics',
      type: Boolean,
      example: false,
    }),
    ApiQuery({
      name: 'groupBy',
      required: false,
      description: 'Group statistics by field',
      enum: groupByEnum,
      example: 'unit',
    }),
    ApiResponse({ status: 200, description: 'Medicine statistics retrieved successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiGetPriceDistribution = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get price distribution analysis',
      description: 'Analyze medicine price distribution with customizable buckets and ranges',
    }),
    ApiQuery({
      name: 'buckets',
      required: false,
      description: 'Number of price buckets for distribution analysis',
      type: Number,
      minimum: 3,
      maximum: 20,
      example: 5,
    }),
    ApiQuery({
      name: 'customRanges',
      required: false,
      description: 'Custom price ranges in JSON format',
      type: String,
      example:
        '[{"min":0,"max":50,"label":"Low"},{"min":50,"max":200,"label":"Medium"},{"min":200,"max":1000,"label":"High"}]',
    }),
    ApiResponse({ status: 200, description: 'Price distribution analysis retrieved successfully' }),
    ApiResponse({ status: 400, description: 'Invalid bucket count or custom ranges format' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiGetUnitUsage = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get unit usage statistics',
      description: 'Analyze how different medicine units are used across the system',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Sort usage statistics by field',
      enum: usageSortByEnum,
      example: 'count',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order for usage statistics',
      enum: sortOrderEnum,
      example: 'desc',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 50,
      example: 10,
    }),
    ApiResponse({ status: 200, description: 'Unit usage statistics retrieved successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiBulkCreateMedicines = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk create medicines',
      description: 'Create multiple medicines at once with validation and duplicate handling',
    }),
    ApiBody({
      description: 'Bulk medicine creation data',
      schema: {
        type: 'object',
        properties: {
          medicines: {
            type: 'array',
            description: 'Array of medicines to create',
            minItems: 1,
            maxItems: 100,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Medicine name', example: 'Efavirenz' },
                description: {
                  type: 'string',
                  description: 'Medicine description',
                  example: 'Antiretroviral medication for HIV treatment',
                },
                unit: { type: 'string', description: 'Medicine unit', enum: unitEnum, example: 'mg' },
                dose: { type: 'string', description: 'Medicine dose', example: '600mg' },
                price: {
                  type: 'number',
                  description: 'Medicine price',
                  minimum: 0.01,
                  maximum: 999999.99,
                  example: 25.5,
                },
              },
              required: ['name', 'unit', 'dose', 'price'],
            },
          },
          skipDuplicates: { type: 'boolean', description: 'Skip medicines with duplicate names', example: false },
        },
        required: ['medicines'],
      },
      examples: {
        example: {
          summary: 'Bulk Create Medicines',
          value: {
            medicines: [
              {
                name: 'Efavirenz',
                description: 'Antiretroviral medication for HIV treatment',
                unit: 'mg',
                dose: '600mg',
                price: 25.5,
              },
              {
                name: 'Tenofovir',
                description: 'Nucleotide reverse transcriptase inhibitor',
                unit: 'mg',
                dose: '300mg',
                price: 45.0,
              },
            ],
            skipDuplicates: false,
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Medicines created successfully' }),
    ApiResponse({ status: 400, description: 'Validation error or duplicate names found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiGetPriceRangeMedicines = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get medicines by price range',
      description:
        'Filter medicines within a specified price range. Useful for budget-based medicine selection and cost analysis.',
    }),
    ApiQuery({
      name: 'minPrice',
      required: true,
      type: Number,
      description: 'Minimum price threshold for filtering medicines',
      example: 50000,
    }),
    ApiQuery({
      name: 'maxPrice',
      required: true,
      type: Number,
      description: 'Maximum price threshold for filtering medicines',
      example: 200000,
    }),
    ApiResponse({ status: 200, description: 'Medicines filtered by price range successfully' }),
    ApiResponse({ status: 400, description: 'Invalid price range' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )

export const ApiGetAdvancedSearchMedicines = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Advanced search for medicines',
      description:
        'Perform advanced search with multiple criteria including name, price range, unit type, and pagination. Provides comprehensive filtering capabilities for medicine discovery.',
    }),
    ApiQuery({
      name: 'query',
      required: false,
      type: String,
      description: 'Search term for medicine name or description',
      example: 'Paracetamol',
    }),
    ApiQuery({
      name: 'unit',
      required: false,
      type: String,
      description: 'Filter by medicine unit (e.g., mg, ml, tablet)',
      example: 'mg',
    }),
    ApiQuery({
      name: 'minPrice',
      required: false,
      type: Number,
      description: 'Minimum price for filtering',
      example: 10000,
    }),
    ApiQuery({
      name: 'maxPrice',
      required: false,
      type: Number,
      description: 'Maximum price for filtering',
      example: 100000,
    }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results per page', example: 10 }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination', example: 1 }),
    ApiResponse({ status: 200, description: 'Medicines found successfully' }),
    ApiResponse({ status: 400, description: 'Invalid search/filter parameters' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  )
