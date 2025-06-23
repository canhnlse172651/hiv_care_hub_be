import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'

export const ApiGetAllTreatmentProtocols = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all treatment protocols',
      description: 'Retrieve a paginated list of all treatment protocols with optional filtering',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of items per page',
      type: Number,
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search query for protocol name, description, or target disease',
      type: String,
      example: 'HIV treatment',
    }),
    ApiQuery({
      name: 'targetDisease',
      required: false,
      description: 'Filter by target disease',
      type: String,
      example: 'HIV',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Field to sort by',
      enum: ['name', 'targetDisease', 'createdAt'],
      example: 'name',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order',
      enum: ['asc', 'desc'],
      example: 'asc',
    }),
    ApiResponse({
      status: 200,
      description: 'Treatment protocols retrieved successfully',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiGetTreatmentProtocolById = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get treatment protocol by ID',
      description: 'Retrieve a specific treatment protocol by its ID',
    }),
    ApiParam({
      name: 'id',
      description: 'Treatment Protocol ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Treatment protocol retrieved successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Treatment protocol not found',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiCreateTreatmentProtocol = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create new treatment protocol',
      description: 'Create a new treatment protocol with medicines',
    }),
    ApiBody({
      description: 'Treatment protocol data',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Protocol name',
            example: 'HIV Treatment Protocol A',
          },
          description: {
            type: 'string',
            description: 'Protocol description',
            example: 'Standard HIV treatment protocol for newly diagnosed patients',
          },
          targetDisease: {
            type: 'string',
            description: 'Target disease',
            example: 'HIV',
          },
          medicines: {
            type: 'array',
            description: 'List of medicines in the protocol',
            items: {
              type: 'object',
              properties: {
                medicineId: {
                  type: 'number',
                  description: 'Medicine ID',
                  example: 1,
                },
                dosage: {
                  type: 'string',
                  description: 'Medicine dosage',
                  example: '600mg once daily',
                },
                duration: {
                  type: 'string',
                  enum: ['MORNING', 'AFTERNOON', 'NIGHT'],
                  description: 'When to take the medicine',
                  example: 'MORNING',
                },
                notes: {
                  type: 'string',
                  description: 'Additional notes',
                  example: 'Take with food',
                },
              },
              required: ['medicineId', 'dosage', 'duration'],
            },
          },
        },
        required: ['name', 'targetDisease', 'medicines'],
      },
      examples: {
        example: {
          summary: 'Create Treatment Protocol',
          value: {
            name: 'HIV Treatment Protocol A',
            description: 'Standard HIV treatment protocol for newly diagnosed patients',
            targetDisease: 'HIV',
            medicines: [
              {
                medicineId: 1,
                dosage: '600mg once daily',
                duration: 'MORNING',
                notes: 'Take with food',
              },
              {
                medicineId: 2,
                dosage: '200mg twice daily',
                duration: 'MORNING',
                notes: 'Take before meals',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Treatment protocol created successfully',
    }),
    ApiResponse({
      status: 409,
      description: 'Treatment protocol with this name already exists',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiUpdateTreatmentProtocol = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update treatment protocol',
      description: 'Update an existing treatment protocol',
    }),
    ApiParam({
      name: 'id',
      description: 'Treatment Protocol ID',
      type: Number,
      example: 1,
    }),
    ApiBody({
      description: 'Updated treatment protocol data',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Protocol name',
            example: 'HIV Treatment Protocol A',
          },
          description: {
            type: 'string',
            description: 'Protocol description',
            example: 'Standard HIV treatment protocol for newly diagnosed patients',
          },
          targetDisease: {
            type: 'string',
            description: 'Target disease',
            example: 'HIV',
          },
          medicines: {
            type: 'array',
            description: 'List of medicines in the protocol',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Protocol Medicine ID (for existing)',
                  example: 1,
                },
                medicineId: {
                  type: 'number',
                  description: 'Medicine ID',
                  example: 1,
                },
                dosage: {
                  type: 'string',
                  description: 'Medicine dosage',
                  example: '600mg once daily',
                },
                duration: {
                  type: 'string',
                  enum: ['MORNING', 'AFTERNOON', 'NIGHT'],
                  description: 'When to take the medicine',
                  example: 'MORNING',
                },
                notes: {
                  type: 'string',
                  description: 'Additional notes',
                  example: 'Take with food',
                },
              },
              required: ['medicineId', 'dosage', 'duration'],
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Treatment protocol updated successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Treatment protocol not found',
    }),
    ApiResponse({
      status: 409,
      description: 'Treatment protocol with this name already exists',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiDeleteTreatmentProtocol = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete treatment protocol',
      description: 'Delete an existing treatment protocol',
    }),
    ApiParam({
      name: 'id',
      description: 'Treatment Protocol ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Treatment protocol deleted successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Treatment protocol not found',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiSearchTreatmentProtocols = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Search treatment protocols',
      description: 'Search treatment protocols by name, description, or target disease',
    }),
    ApiQuery({
      name: 'q',
      description: 'Search query',
      type: String,
      required: true,
      example: 'HIV treatment protocol',
    }),
    ApiResponse({
      status: 200,
      description: 'Treatment protocols found successfully',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiAdvancedSearchTreatmentProtocols = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Advanced search for treatment protocols',
      description: 'Search treatment protocols with multiple filters',
    }),
    ApiQuery({
      name: 'query',
      required: false,
      description: 'Search query',
      type: String,
      example: 'HIV treatment',
    }),
    ApiQuery({
      name: 'targetDisease',
      required: false,
      description: 'Filter by target disease',
      type: String,
      example: 'HIV',
    }),
    ApiQuery({
      name: 'createdById',
      required: false,
      description: 'Filter by creator ID',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'minMedicineCount',
      required: false,
      description: 'Minimum number of medicines',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'maxMedicineCount',
      required: false,
      description: 'Maximum number of medicines',
      type: Number,
      example: 10,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of items per page',
      type: Number,
      example: 10,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Advanced search completed successfully',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiFindTreatmentProtocolByName = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Find treatment protocol by name',
      description: 'Find a specific treatment protocol by its exact name',
    }),
    ApiQuery({
      name: 'name',
      description: 'Protocol name',
      type: String,
      required: true,
      example: 'HIV Treatment Protocol A',
    }),
    ApiResponse({
      status: 200,
      description: 'Protocol found successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Protocol not found',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiGetProtocolUsageStats = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get protocol usage statistics',
      description: 'Get detailed usage statistics for a specific protocol',
    }),
    ApiParam({
      name: 'id',
      description: 'Protocol ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Usage statistics retrieved successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Protocol not found',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiGetMostPopularProtocols = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get most popular protocols',
      description: 'Get a list of the most frequently used treatment protocols',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of protocols to return',
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Popular protocols retrieved successfully',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  )

export const ApiGetProtocolEffectivenessMetrics = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get protocol effectiveness metrics',
      description: 'Retrieve comprehensive effectiveness metrics for a specific treatment protocol',
    }),
    ApiParam({
      name: 'id',
      description: 'Treatment Protocol ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Protocol effectiveness metrics retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          protocol: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              targetDisease: { type: 'string' },
            },
          },
          totalUsages: { type: 'number' },
          completedTreatments: { type: 'number' },
          activeTreatments: { type: 'number' },
          averageTreatmentDuration: { type: 'number', nullable: true },
          averageCost: { type: 'number' },
          successRate: { type: 'number', nullable: true },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Protocol not found',
    }),
  )

export const ApiGetProtocolComparison = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Compare multiple protocols',
      description: 'Compare effectiveness metrics across multiple treatment protocols',
    }),
    ApiBody({
      description: 'Protocol IDs to compare',
      schema: {
        type: 'object',
        properties: {
          protocolIds: {
            type: 'array',
            items: { type: 'number' },
            minItems: 2,
            maxItems: 10,
            description: 'Array of protocol IDs to compare',
          },
        },
        required: ['protocolIds'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Protocol comparison data retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          protocols: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                description: { type: 'string' },
                targetDisease: { type: 'string' },
              },
            },
          },
          comparison: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                protocolId: { type: 'number' },
                name: { type: 'string' },
                totalUsage: { type: 'number' },
                successRate: { type: 'number', nullable: true },
                averageCost: { type: 'number' },
                activeTreatments: { type: 'number' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid protocol IDs or insufficient protocols for comparison',
    }),
  )

export const ApiGetProtocolTrendAnalysis = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get protocol trend analysis',
      description: 'Analyze usage trends for protocols over time with optional filters',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Start date for trend analysis (ISO date string)',
      type: String,
      example: '2024-01-01T00:00:00Z',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'End date for trend analysis (ISO date string)',
      type: String,
      example: '2024-12-31T23:59:59Z',
    }),
    ApiQuery({
      name: 'disease',
      required: false,
      description: 'Filter by specific disease',
      type: String,
      example: 'HIV',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Maximum number of protocols to analyze',
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Protocol trend analysis data retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            protocol: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                targetDisease: { type: 'string' },
              },
            },
            usageCount: { type: 'number' },
            trend: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
            changePercentage: { type: 'number' },
          },
        },
      },
    }),
  )

export const ApiCreateCustomProtocolFromTreatment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create custom protocol from existing treatment',
      description: 'Generate a new treatment protocol based on an existing patient treatment with customizations',
    }),
    ApiParam({
      name: 'treatmentId',
      description: 'Patient Treatment ID to base the new protocol on',
      type: Number,
      example: 1,
    }),
    ApiBody({
      description: 'Custom protocol data',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the new custom protocol',
            minLength: 1,
            maxLength: 500,
          },
          description: {
            type: 'string',
            description: 'Optional description for the custom protocol',
          },
          targetDisease: {
            type: 'string',
            description: 'Target disease for the protocol',
            minLength: 1,
            maxLength: 200,
          },
        },
        required: ['name', 'targetDisease'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Custom protocol created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          description: { type: 'string' },
          targetDisease: { type: 'string' },
          createdById: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Treatment not found',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid treatment data or protocol data',
    }),
  )

export const ApiFindTreatmentProtocolsPaginated = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Find treatment protocols with advanced pagination',
      description: 'Advanced paginated search with complex filtering and sorting options',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of items per page',
      type: Number,
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search across multiple fields',
      type: String,
      example: 'HIV treatment',
    }),
    ApiQuery({
      name: 'filters',
      required: false,
      description: 'JSON string of advanced filters',
      type: String,
      example: '{"targetDisease": "HIV", "isActive": true}',
    }),
    ApiResponse({
      status: 200,
      description: 'Paginated protocols retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                description: { type: 'string' },
                targetDisease: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
    }),
  )

export const ApiGetProtocolsWithCustomVariations = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get protocols with custom variations',
      description: 'Retrieve protocols that have custom variations created from patient treatments',
    }),
    ApiResponse({
      status: 200,
      description: 'Protocols with custom variations retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            protocol: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                description: { type: 'string' },
                targetDisease: { type: 'string' },
              },
            },
            variations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  customizations: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
      },
    }),
  )

export const ApiCloneTreatmentProtocol = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Clone a treatment protocol',
      description: 'Create a copy of an existing treatment protocol with a new name',
    }),
    ApiParam({
      name: 'id',
      description: 'Treatment Protocol ID to clone',
      type: Number,
      example: 1,
    }),
    ApiBody({
      description: 'Clone protocol data',
      schema: {
        type: 'object',
        properties: {
          newName: {
            type: 'string',
            description: 'Name for the cloned protocol',
            minLength: 1,
            maxLength: 500,
          },
        },
        required: ['newName'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Protocol cloned successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          description: { type: 'string' },
          targetDisease: { type: 'string' },
          createdById: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Original protocol not found',
    }),
    ApiResponse({
      status: 409,
      description: 'Protocol with the new name already exists',
    }),
  )

export const ApiBulkCreateTreatmentProtocols = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk create treatment protocols',
      description: 'Create multiple treatment protocols in a single operation with optional duplicate handling',
    }),
    ApiBody({
      description: 'Bulk protocol creation data',
      schema: {
        type: 'object',
        properties: {
          protocols: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 500 },
                description: { type: 'string' },
                targetDisease: { type: 'string', minLength: 1, maxLength: 200 },
                medicines: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      medicineId: { type: 'number' },
                      dosage: { type: 'string' },
                      duration: { type: 'string', enum: ['MORNING', 'AFTERNOON', 'NIGHT'] },
                      notes: { type: 'string' },
                    },
                  },
                },
              },
              required: ['name', 'targetDisease', 'medicines'],
            },
          },
          skipDuplicates: {
            type: 'boolean',
            description: 'Whether to skip duplicate names',
            default: false,
          },
        },
        required: ['protocols'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Protocols created successfully',
      schema: {
        type: 'object',
        properties: {
          count: { type: 'number', description: 'Number of protocols successfully created' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of errors encountered during creation',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid protocol data',
    }),
  )
