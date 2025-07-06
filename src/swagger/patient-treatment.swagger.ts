import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'

export const ApiGetAllPatientTreatments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all patient treatments',
      description: 'Retrieve a paginated list of all patient treatments with optional filtering',
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
      description: 'Search query to filter treatments',
      type: String,
      example: 'patient name or notes',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Filter by start date (YYYY-MM-DD)',
      type: String,
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'Filter by end date (YYYY-MM-DD)',
      type: String,
      example: '2024-12-31',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Field to sort by',
      enum: ['startDate', 'endDate', 'total', 'createdAt'],
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order',
      enum: ['asc', 'desc'],
      example: 'desc',
    }),
    ApiResponse({
      status: 200,
      description: 'Patient treatments retrieved successfully',
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

export const ApiGetPatientTreatmentById = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get patient treatment by ID',
      description: 'Retrieve a specific patient treatment by its ID',
    }),
    ApiParam({
      name: 'id',
      description: 'Patient Treatment ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Patient treatment retrieved successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Patient treatment not found',
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

export const ApiCreatePatientTreatment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create new patient treatment',
      description:
        'Create a new patient treatment entry. Use autoEndExisting=true to automatically end any existing active treatments for the patient.',
    }),
    ApiQuery({
      name: 'autoEndExisting',
      required: false,
      description: 'Automatically end existing active treatments for the patient before creating new one',
      type: Boolean,
      example: false,
    }),
    ApiBody({
      description: 'Patient treatment data',
      schema: {
        type: 'object',
        properties: {
          patientId: {
            type: 'number',
            description: 'Patient ID',
            example: 1,
          },
          protocolId: {
            type: 'number',
            description: 'Treatment Protocol ID',
            example: 1,
          },
          doctorId: {
            type: 'number',
            description: 'Doctor ID',
            example: 1,
          },
          customMedications: {
            type: 'object',
            description: 'Custom medications (JSON)',
            example: {
              additionalMeds: [
                {
                  name: 'Vitamin D',
                  dosage: '1000 IU daily',
                },
              ],
            },
          },
          notes: {
            type: 'string',
            description: 'Treatment notes',
            example: 'Patient responds well to treatment',
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Treatment start date',
            example: '2024-01-01T00:00:00Z',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Treatment end date',
            example: '2024-12-31T23:59:59Z',
          },
          total: {
            type: 'number',
            description: 'Total treatment cost',
            example: 1500.0,
          },
        },
        required: ['patientId', 'protocolId', 'doctorId', 'startDate', 'total'],
      },
      examples: {
        example: {
          summary: 'Create Patient Treatment',
          value: {
            patientId: 1,
            protocolId: 1,
            doctorId: 1,
            customMedications: {
              additionalMeds: [
                {
                  name: 'Vitamin D',
                  dosage: '1000 IU daily',
                },
              ],
            },
            notes: 'Patient responds well to treatment',
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T23:59:59Z',
            total: 1500,
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Patient treatment created successfully',
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

export const ApiUpdatePatientTreatment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update patient treatment',
      description: 'Update an existing patient treatment',
    }),
    ApiParam({
      name: 'id',
      description: 'Patient Treatment ID',
      type: Number,
      example: 1,
    }),
    ApiBody({
      description: 'Updated patient treatment data',
      schema: {
        type: 'object',
        properties: {
          protocolId: {
            type: 'number',
            description: 'Treatment Protocol ID',
            example: 1,
          },
          doctorId: {
            type: 'number',
            description: 'Doctor ID',
            example: 1,
          },
          customMedications: {
            type: 'object',
            description: 'Custom medications (JSON)',
            example: {
              additionalMeds: [
                {
                  name: 'Vitamin D',
                  dosage: '1000 IU daily',
                },
              ],
            },
          },
          notes: {
            type: 'string',
            description: 'Treatment notes',
            example: 'Patient responds well to treatment',
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Treatment start date',
            example: '2024-01-01T00:00:00Z',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Treatment end date',
            example: '2024-12-31T23:59:59Z',
          },
          total: {
            type: 'number',
            description: 'Total treatment cost',
            example: 1500.0,
          },
        },
      },
      examples: {
        example: {
          summary: 'Update Patient Treatment',
          value: {
            protocolId: 1,
            doctorId: 1,
            customMedications: {
              additionalMeds: [
                {
                  name: 'Vitamin D',
                  dosage: '1000 IU daily',
                },
              ],
            },
            notes: 'Patient responds well to treatment - updated',
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T23:59:59Z',
            total: 1600,
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Patient treatment updated successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Patient treatment not found',
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

export const ApiDeletePatientTreatment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete patient treatment',
      description: 'Delete an existing patient treatment',
    }),
    ApiParam({
      name: 'id',
      description: 'Patient Treatment ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Patient treatment deleted successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Patient treatment not found',
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

export const ApiGetPatientTreatmentsByPatient = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get patient treatments by patient ID',
      description: 'Retrieve all treatments for a specific patient',
    }),
    ApiParam({
      name: 'patientId',
      description: 'Patient ID',
      type: Number,
      example: 123,
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
      name: 'sortBy',
      required: false,
      description: 'Field to sort by (e.g., createdAt, total, startDate)',
      type: String,
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order (asc or desc)',
      type: String,
      enum: ['asc', 'desc'],
      example: 'desc',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Filter by start date (YYYY-MM-DD)',
      type: String,
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'Filter by end date (YYYY-MM-DD)',
      type: String,
      example: '2024-12-31',
    }),
    ApiQuery({
      name: 'includeCompleted',
      required: false,
      description: 'Include completed treatments (true/false)',
      type: String,
      enum: ['true', 'false'],
      example: 'true',
    }),
    ApiResponse({
      status: 200,
      description: 'Patient treatments retrieved successfully',
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

export const ApiGetPatientTreatmentsByDoctor = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get patient treatments by doctor',
      description: 'Retrieve a paginated list of patient treatments for a specific doctor',
    }),
    ApiParam({
      name: 'doctorId',
      description: 'Doctor ID',
      type: Number,
      example: 456,
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
      name: 'sortBy',
      required: false,
      description: 'Field to sort by (e.g., createdAt, total, patientId)',
      type: String,
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order (asc or desc)',
      type: String,
      enum: ['asc', 'desc'],
      example: 'desc',
    }),
    ApiResponse({
      status: 200,
      description: 'Patient treatments retrieved successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Doctor not found',
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

// ===============================
// SEARCH AND ADVANCED QUERIES
// ===============================

export const ApiSearchPatientTreatments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Search patient treatments',
      description: 'Search patient treatments by patient name, doctor name, protocol name, or notes',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search query for treatment search',
      type: String,
      example: 'patient name or treatment notes',
    }),
    ApiQuery({
      name: 'q',
      required: false,
      description: 'Alternative search query parameter',
      type: String,
      example: 'treatment name or doctor name',
    }),
    ApiQuery({
      name: 'query',
      required: false,
      description: 'Another alternative search query parameter',
      type: String,
      example: 'protocol name or notes',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number for pagination',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Maximum number of results per page',
      type: Number,
      example: 50,
    }),
    ApiResponse({
      status: 200,
      description: 'Patient treatments found successfully (paginated)',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                notes: { type: 'string' },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time', nullable: true },
                total: { type: 'number' },
                patient: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
                doctor: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                      },
                    },
                  },
                },
                protocol: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 150 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 15 },
              hasNextPage: { type: 'boolean', example: true },
              hasPreviousPage: { type: 'boolean', example: false },
            },
          },
        },
      },
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

export const ApiGetPatientTreatmentsByDateRange = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get patient treatments by date range',
      description: 'Retrieve patient treatments within a specific date range',
    }),
    ApiQuery({
      name: 'startDate',
      required: true,
      description: 'Start date (YYYY-MM-DD)',
      type: String,
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: true,
      description: 'End date (YYYY-MM-DD)',
      type: String,
      example: '2024-12-31',
    }),
    ApiResponse({
      status: 200,
      description: 'Patient treatments retrieved successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid date format',
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

export const ApiGetActivePatientTreatments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get active patient treatments (Unified API)',
      description: `
      **Enhanced unified endpoint for retrieving active patient treatments**
      
      🔄 **Unified Logic**: This endpoint replaces separate endpoints for general and patient-specific queries
      📊 **Advanced Pagination**: Built-in pagination with comprehensive metadata
      🔍 **Flexible Filtering**: Filter by patient, doctor, or protocol
      ⚡ **Optimized Performance**: Uses repository-level optimizations and caching
      
      **Active Treatment Criteria:**
      - Treatments with no end date (ongoing)
      - Treatments with end date in the future
      
      **Business Rules Applied:**
      - Only treatments that are currently active based on date validation
      - Consistent cost calculations across all results
      - Enhanced error handling and validation
      
      **Usage Examples:**
      - Get all active treatments: \`/active\`
      - Filter by patient: \`/active?patientId=123\`
      - With pagination: \`/active?page=1&limit=10\`
      - Multiple filters: \`/active?patientId=123&doctorId=456&page=1\`
      `,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number for pagination (default: 1)',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of items per page (default: 10, max: 100)',
      type: Number,
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Field to sort by',
      enum: ['startDate', 'endDate', 'total', 'createdAt'],
      example: 'startDate',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order',
      enum: ['asc', 'desc'],
      example: 'desc',
    }),
    ApiQuery({
      name: 'patientId',
      required: false,
      description: 'Filter by specific patient ID (unified patient-specific queries)',
      type: Number,
      example: 123,
    }),
    ApiQuery({
      name: 'doctorId',
      required: false,
      description: 'Filter by specific doctor ID',
      type: Number,
      example: 456,
    }),
    ApiQuery({
      name: 'protocolId',
      required: false,
      description: 'Filter by specific protocol ID',
      type: Number,
      example: 789,
    }),
    ApiResponse({
      status: 200,
      description: 'Active patient treatments retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                patientId: { type: 'number' },
                protocolId: { type: 'number' },
                doctorId: { type: 'number' },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time', nullable: true },
                notes: { type: 'string', nullable: true },
                total: { type: 'number', description: 'Total cost calculated with enhanced logic' },
                customMedications: { type: 'object', nullable: true },
                patient: { type: 'object' },
                protocol: { type: 'object' },
                doctor: { type: 'object' },
                createdBy: { type: 'object' },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', description: 'Total number of active treatments' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
              hasNextPage: { type: 'boolean' },
              hasPreviousPage: { type: 'boolean' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - insufficient permissions',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  )

export const ApiGetTreatmentsWithCustomMedications = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get treatments with custom medications',
      description: 'Retrieve patient treatments that have custom medications',
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
      name: 'sortBy',
      required: false,
      description: 'Field to sort by (e.g., createdAt, patientId, total)',
      type: String,
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order (asc or desc)',
      type: String,
      enum: ['asc', 'desc'],
      example: 'desc',
    }),
    ApiQuery({
      name: 'hasCustomMeds',
      required: false,
      description: 'Filter by whether treatment has custom medications (true/false)',
      type: String,
      enum: ['true', 'false'],
      example: 'true',
    }),
    ApiResponse({
      status: 200,
      description: 'Treatments with custom medications retrieved successfully',
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

// ===============================
// STATISTICS AND ANALYTICS
// ===============================

export const ApiGetPatientTreatmentStats = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get patient treatment statistics',
      description: "Retrieve comprehensive statistics for a specific patient's treatments",
    }),
    ApiParam({
      name: 'patientId',
      description: 'Patient ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Patient treatment statistics retrieved successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Patient not found',
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

export const ApiGetDoctorWorkloadStats = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get doctor workload statistics',
      description: 'Retrieve workload statistics for a specific doctor',
    }),
    ApiParam({
      name: 'doctorId',
      description: 'Doctor ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Doctor workload statistics retrieved successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Doctor not found',
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

export const ApiGetCustomMedicationStats = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get custom medication statistics',
      description: 'Retrieve statistics about custom medication usage across all treatments',
    }),
    ApiResponse({
      status: 200,
      description: 'Custom medication statistics retrieved successfully',
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

export const ApiCompareProtocolVsCustomTreatments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Compare protocol vs custom treatments',
      description: 'Compare standard protocol treatments with custom treatments for analysis',
    }),
    ApiParam({
      name: 'protocolId',
      description: 'Protocol ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Protocol comparison retrieved successfully',
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

export const ApiGetTreatmentComplianceStats = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get patient treatment compliance statistics',
      description:
        'Retrieve detailed compliance analytics for a specific patient including adherence rates, missed doses, and treatment progression.',
    }),
    ApiParam({
      name: 'patientId',
      description: 'Patient ID',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Treatment compliance statistics retrieved successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Patient not found',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Patients can only access their own compliance statistics',
    }),
  )

export const ApiGetTreatmentCostAnalysis = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get treatment cost analysis',
      description:
        'Analyze costs of patient treatments with detailed breakdown by medications, protocols, and time periods. Supports filtering by patient, doctor, protocol, and date range.',
    }),
    ApiQuery({
      name: 'patientId',
      required: false,
      description: 'Filter by patient ID',
      type: Number,
      example: 123,
    }),
    ApiQuery({
      name: 'doctorId',
      required: false,
      description: 'Filter by doctor ID',
      type: Number,
      example: 456,
    }),
    ApiQuery({
      name: 'protocolId',
      required: false,
      description: 'Filter by protocol ID',
      type: Number,
      example: 789,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Filter by start date (YYYY-MM-DD)',
      type: String,
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'Filter by end date (YYYY-MM-DD)',
      type: String,
      example: '2024-12-31',
    }),
    ApiResponse({
      status: 200,
      description: 'Treatment cost analysis retrieved successfully',
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

// ===============================
// BULK OPERATIONS
// ===============================

export const ApiBulkCreatePatientTreatments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk create patient treatments',
      description: 'Create multiple patient treatments in a single operation',
    }),
    ApiBody({
      description: 'Array of patient treatment data',
      type: 'array',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            patientId: { type: 'number', example: 1 },
            protocolId: { type: 'number', example: 1 },
            doctorId: { type: 'number', example: 1 },
            notes: { type: 'string', example: 'Treatment notes' },
            startDate: { type: 'string', format: 'date', example: '2024-01-01' },
            endDate: { type: 'string', format: 'date', example: '2024-12-31' },
            total: { type: 'number', example: 250.5 },
            customMedications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  medicineId: { type: 'number', example: 1 },
                  dosage: { type: 'string', example: '100mg' },
                  duration: { type: 'string', example: 'MORNING' },
                  notes: { type: 'string', example: 'Take with food' },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Patient treatments created successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data',
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

export const ApiEndActivePatientTreatments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'End all active treatments for a patient',
      description:
        'Sets endDate to current date for all active treatments of a specific patient. Ensures only one protocol can be active per patient at a time.',
    }),
    ApiParam({
      name: 'patientId',
      description: 'Patient ID to end active treatments for',
      type: Number,
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: 'Active treatments ended successfully',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: 'Whether the operation was successful',
          },
          message: {
            type: 'string',
            example: 'Successfully ended 2 active treatment(s) for patient 123',
            description: 'Success message with details',
          },
          deactivatedCount: {
            type: 'number',
            example: 2,
            description: 'Number of treatments that were ended',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            example: '2025-06-21T10:30:00Z',
            description: 'The end date that was set for all treatments',
          },
          activeTreatments: {
            type: 'array',
            description: 'The treatments that were ended (for reference)',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                patientId: { type: 'number' },
                protocolId: { type: 'number' },
                startDate: { type: 'string', format: 'date-time' },
                notes: { type: 'string' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Patient not found',
    }),
    ApiResponse({
      status: 403,
      description: 'Insufficient permissions',
    }),
  )

export const ApiGetActivePatientTreatmentsByPatient = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get active treatments for a specific patient (Enhanced)',
      description: `
      **Enhanced patient-specific active treatment endpoint**
      
      🎯 **Patient-Focused**: Returns detailed active treatments for a specific patient
      📊 **Enhanced Status**: Includes treatment timing and status indicators
      ⚖️ **Business Rule Compliance**: Enforces "1 patient = 1 active protocol" rule
      🔒 **Security**: Patients can only access their own treatment records
      
      **Enhanced Features:**
      - \`isCurrent\`: Indicates the single currently active treatment
      - \`treatmentStatus\`: upcoming, active, or ending_soon
      - \`daysRemaining\`: Days until treatment ends (if applicable)
      - \`isStarted\`: Whether treatment has begun
      
      **Business Logic:**
      - Only ONE treatment will have \`isCurrent: true\` at any time
      - Treatments are sorted by priority (current first, then by start date)
      - Validates single active protocol rule per patient
      - Enhanced date validation and status calculation
      
      **Access Control:**
      - Admin/Doctor/Staff: Can access any patient's treatments
      - Patient role: Can only access their own treatments (patientId must match user ID)
      `,
    }),
    ApiParam({
      name: 'patientId',
      description: 'Patient ID to get active treatments for',
      type: Number,
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: 'Active treatments retrieved successfully with enhanced status information',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            patientId: { type: 'number' },
            protocolId: { type: 'number' },
            doctorId: { type: 'number' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            notes: { type: 'string', nullable: true },
            total: { type: 'number', description: 'Enhanced cost calculation' },
            customMedications: { type: 'object', nullable: true },
            isCurrent: {
              type: 'boolean',
              description:
                'TRUE for the single currently active treatment (business rule: 1 patient = 1 active protocol)',
            },
            isStarted: {
              type: 'boolean',
              description: 'Whether the treatment has started based on start date',
            },
            daysRemaining: {
              type: 'number',
              nullable: true,
              description: 'Days remaining until treatment ends (null for indefinite treatments)',
            },
            treatmentStatus: {
              type: 'string',
              enum: ['upcoming', 'active', 'ending_soon'],
              description: 'Current status of the treatment',
            },
            protocol: {
              type: 'object',
              description: 'Full protocol details including medicines',
            },
            doctor: {
              type: 'object',
              description: 'Doctor information including user details',
            },
            patient: {
              type: 'object',
              description: 'Patient information',
            },
            testResults: {
              type: 'array',
              description: 'Associated test results (if available)',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Patients can only access their own treatment records',
    }),
    ApiResponse({
      status: 404,
      description: 'Patient not found',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
  )

// Enhanced API Documentation for Active Patient Treatments
export const ApiGetActivePatientTreatmentsSummary = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get comprehensive active treatment summary',
      description: `
      **Advanced analytics endpoint for active patient treatments**
      
      📊 **Comprehensive Statistics**: Provides overview of all active treatments
      🎯 **Patient-Specific Details**: Optional patient-specific breakdown
      📈 **Status Analytics**: Breakdown by treatment status (upcoming, active, ending_soon)
      ⚡ **Performance Optimized**: Single query for complex analytics
      
      **Features:**
      - Total active treatments count
      - Status breakdown (upcoming/active/ending soon)
      - Recent treatments preview
      - Optional patient-specific details
      - Business rule validation insights
      
      **Usage:**
      - General summary: \`/active/summary\`
      - Patient-specific: \`/active/summary?patientId=123\`
      `,
    }),
    ApiQuery({
      name: 'patientId',
      required: false,
      description: 'Optional patient ID for patient-specific summary',
      type: Number,
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: 'Active treatment summary retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          totalActiveTreatments: { type: 'number' },
          treatmentsByStatus: {
            type: 'object',
            properties: {
              upcoming: { type: 'number' },
              active: { type: 'number' },
              ending_soon: { type: 'number' },
            },
          },
          recentTreatments: {
            type: 'array',
            items: { type: 'object' },
          },
          patientSpecific: {
            type: 'object',
            nullable: true,
            properties: {
              patientId: { type: 'number' },
              activeTreatments: { type: 'array' },
              hasActiveTreatment: { type: 'boolean' },
              nextUpcoming: { type: 'object', nullable: true },
            },
          },
        },
      },
    }),
  )

export const ApiGetActivePatientTreatmentsPaginated = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get active treatments with enhanced pagination and search',
      description: `
      **Advanced paginated search for active patient treatments**
      
      🔍 **Enhanced Search**: Search across patient names, doctor names, protocol names, and notes
      📄 **Smart Pagination**: Comprehensive pagination with metadata
      🎛️ **Flexible Filtering**: Multiple filter options with patient/search combinations
      📊 **Rich Results**: Full treatment details with relationships
      
      **Search Capabilities:**
      - Patient name search
      - Doctor name search  
      - Protocol name search
      - Treatment notes search
      - Case-insensitive matching
      
      **Usage Examples:**
      - Basic pagination: \`/active/paginated?skip=0&take=10\`
      - With search: \`/active/paginated?search=HIV&skip=0&take=10\`
      - Patient-specific: \`/active/paginated?patientId=123&search=protocol\`
      `,
    }),
    ApiQuery({
      name: 'patientId',
      required: false,
      description: 'Filter by specific patient ID',
      type: Number,
      example: 123,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search term for patient name, doctor name, protocol name, or notes',
      type: String,
      example: 'HIV protocol',
    }),
    ApiQuery({
      name: 'skip',
      required: false,
      description: 'Number of records to skip (default: 0)',
      type: Number,
      example: 0,
    }),
    ApiQuery({
      name: 'take',
      required: false,
      description: 'Number of records to take (default: 10, max: 100)',
      type: Number,
      example: 10,
    }),
    ApiQuery({
      name: 'orderBy',
      required: false,
      description: 'Sort configuration (JSON object)',
      type: String,
      example: '{"startDate": "desc"}',
    }),
    ApiResponse({
      status: 200,
      description: 'Paginated active treatments with search results',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { type: 'object' },
          },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              skip: { type: 'number' },
              take: { type: 'number' },
              hasNext: { type: 'boolean' },
              hasPrevious: { type: 'boolean' },
            },
          },
        },
      },
    }),
  )
