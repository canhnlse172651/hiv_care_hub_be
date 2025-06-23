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
      name: 'patientId',
      required: false,
      description: 'Filter by patient ID',
      type: Number,
      example: 123,
    }),
    ApiQuery({
      name: 'doctorId',
      required: false,
      example: '2024-12-31',
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
      description: 'Create a new patient treatment entry',
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
      description: 'Patient treatments found successfully',
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
      summary: 'Get active patient treatments',
      description: 'Retrieve currently active patient treatments (treatments without end date or end date in future)',
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
      name: 'patientId',
      required: false,
      description: 'Filter by specific patient ID',
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
