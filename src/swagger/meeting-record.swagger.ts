import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiProperty, ApiQuery, ApiResponse } from '@nestjs/swagger'

export const MeetingRecordResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    appointmentId: { type: 'number', example: 1 },
    title: { type: 'string', example: 'Understanding NestJS Swagger Integration' },
    content: { type: 'string', example: 'NestJS provides powerful decorators to document APIs...' },
    startTime: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' },
    endTime: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' },
    recordedById: { type: 'number', example: 1 },
    createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' },
  },
}

export const ApiCreateMeetingRecord = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new meeting record' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['appointmentId', 'title', 'content', 'startTime', 'endTime', 'recordedById'],
        properties: {
          appointmentId: { type: 'number', description: 'ID of the appointment', example: 1 },
          title: {
            type: 'string',
            description: 'Title of the meeting record',
            example: 'Understanding NestJS Swagger Integration',
          },
          content: {
            type: 'string',
            description: 'Content of the meeting record',
            example: 'NestJS provides powerful decorators to document APIs...',
          },
          startTime: {
            type: 'string',
            format: 'date-time',
            description: 'Start time of the meeting record',
            example: '2025-01-01T00:00:00Z',
          },
          endTime: {
            type: 'string',
            format: 'date-time',
            description: 'End time of the meeting record',
            example: '2025-01-01T00:00:00Z',
          },
          recordedById: { type: 'number', description: 'ID of the user who recorded the meeting', example: 1 },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Meeting record created successfully',
      schema: MeetingRecordResponseSchema,
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiGetAllMeetingRecords = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all meeting records' }),
    ApiQuery({ name: 'page', type: Number, required: false, example: 1 }),
    ApiQuery({ name: 'limit', type: Number, required: false, example: 10 }),
    ApiQuery({ name: 'search', type: String, required: false, example: 'NestJS' }),
    ApiQuery({ name: 'sortBy', type: String, required: false, example: 'createdAt' }),
    ApiQuery({ name: 'sortOrder', type: String, required: false, example: 'desc' }),
    ApiQuery({ name: 'recordedById', type: Number, required: false, example: 1 }),
    ApiResponse({ status: 200, description: 'Meeting records fetched successfully', schema: MeetingRecordResponseSchema }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiGetMeetingRecordById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get a meeting record by ID' }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Meeting record fetched successfully',
      schema: MeetingRecordResponseSchema,
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Meeting record not found' }),
  )
}

export const ApiGetMeetingRecordByAppointmentId = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get a meeting record by appointment ID' }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({ status: 200, description: 'Meeting record fetched successfully', schema: MeetingRecordResponseSchema }),
  )
}

export const ApiUpdateMeetingRecord = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update a meeting record by ID' }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiBody({ schema: MeetingRecordResponseSchema }),
    ApiResponse({ status: 200, description: 'Meeting record updated successfully', schema: MeetingRecordResponseSchema }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Meeting record not found' }),
  )
}

export const ApiDeleteMeetingRecord = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a meeting record by ID' }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({ status: 200, description: 'Meeting record deleted successfully' }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Meeting record not found' }),
  )
}