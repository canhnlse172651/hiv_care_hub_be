import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'
export const AppointmentResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    userId: { type: 'number', example: 1 },
    doctorId: { type: 'number', example: 1 },
    serviceId: { type: 'number', example: 1 },
    appointmentTime: { type: 'string', format: 'date-time', example: '2024-03-20T10:00:00Z' },
    isAnonymous: { type: 'boolean', example: false },
    type: { type: 'string', enum: ['ONLINE', 'OFFLINE'], example: 'OFFLINE' },
    status: {
      type: 'string',
      enum: ['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
      example: 'PENDING',
    },
    notes: { type: 'string', nullable: true, example: null },
    createdAt: { type: 'string', format: 'date-time', example: '2024-03-20T10:00:00Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2024-03-20T10:00:00Z' },
  },
}

export const ApiCreateAppointment = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create Appointment', description: 'Create Appointment' }),
    ApiBody({
      description: 'Appointment data',
      schema: {
        type: 'object',
        properties: {
          userId: { type: 'number', description: 'User ID', example: 1 },
          doctorId: { type: 'number', description: 'Doctor ID', example: 1 },
          serviceId: { type: 'number', description: 'Service ID', example: 1 },
          appointmentTime: {
            type: 'string',
            format: 'date-time',
            description: 'Appointment Time',
            example: '2024-03-20T10:00:00Z',
          },
          isAnonymous: { type: 'boolean', description: 'Is Anonymous', example: false },
          type: {
            type: 'string',
            enum: ['ONLINE', 'OFFLINE'],
            description: 'Appointment Type [ONLINE, OFFLINE]',
            example: 'OFFLINE',
          },
          notes: { type: 'string', nullable: true, description: 'Notes', example: null },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Appointment created successfully' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiUpdateAppointment = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update Appointment', description: 'Update Appointment' }),
    ApiParam({ name: 'id', type: 'number', description: 'Appointment ID', example: 1 }),
    ApiBody({
      description: 'Appointment data',
      schema: {
        type: 'object',
        properties: {
          userId: { type: 'number', description: 'User ID', example: 1 },
          doctorId: { type: 'number', description: 'Doctor ID', example: 1 },
          serviceId: { type: 'number', description: 'Service ID', example: 1 },
          appointmentTime: {
            type: 'string',
            format: 'date-time',
            description: 'Appointment Time',
            example: '2024-03-20T10:00:00Z',
          },
          isAnonymous: { type: 'boolean', description: 'Is Anonymous', example: false },
          type: { type: 'string', enum: ['ONLINE', 'OFFLINE'], description: 'Appointment Type', example: 'OFFLINE' },
          notes: { type: 'string', nullable: true, description: 'Notes', example: null },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Appointment updated successfully' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiUpdateAppointmentStatus = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update Appointment Status', description: 'Update Appointment Status' }),
    ApiParam({ name: 'id', type: 'number', description: 'Appointment ID', example: 1 }),
    ApiBody({
      description: 'Appointment status data',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
            description: 'Appointment Status',
            example: 'PENDING',
          },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Appointment status updated successfully' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiDeleteAppointment = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete Appointment', description: 'Delete Appointment' }),
    ApiParam({ name: 'id', type: 'number', description: 'Appointment ID', example: 1 }),
    ApiResponse({ status: 200, description: 'Appointment deleted successfully' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiFindAppointmentById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Find Appointment by ID', description: 'Find Appointment by ID' }),
    ApiParam({ name: 'id', type: 'number', description: 'Appointment ID', example: 1 }),
    ApiResponse({ status: 200, description: 'Appointment found successfully', schema: AppointmentResponseSchema }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Appointment not found' }),
  )
}

export const ApiFindAppointmentByUserId = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Find Appointment by User ID', description: 'Find Appointment by User ID' }),
    ApiParam({ name: 'id', type: 'number', description: 'User ID', example: 1 }),
    ApiQuery({ name: 'page', type: 'number', description: 'Page number', example: 1, required: false }),
    ApiQuery({ name: 'limit', type: 'number', description: 'Limit', example: 10, required: false }),
    ApiQuery({
      name: 'sortBy',
      type: 'string',
      description: 'Sort by',
      required: false,
      enum: ['id', 'createdAt', 'updatedAt', 'appointmentTime', 'status', 'type'],
    }),
    ApiQuery({ name: 'sortOrder', type: 'string', description: 'Sort order', required: false, enum: ['asc', 'desc'] }),
    ApiQuery({
      name: 'serviceType',
      type: 'string',
      description: 'Service Type',
      required: false,
      enum: ['TEST', 'CONSULT', 'TREATMENT'],
    }),
    ApiQuery({
      name: 'status',
      type: 'string',
      description: 'Status',
      required: false,
      enum: ['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    }),
    ApiQuery({
      name: 'type',
      type: 'string',
      description: 'Appointment Type',
      required: false,
      enum: ['ONLINE', 'OFFLINE'],
    }),
    ApiQuery({
      name: 'dateFrom',
      type: 'string',
      format: 'date-time',
      description: 'Filter from date (appointmentTime >= dateFrom)',
      required: false,
      example: '2024-03-20T00:00:00Z',
    }),
    ApiQuery({
      name: 'dateTo',
      type: 'string',
      format: 'date-time',
      description: 'Filter to date (appointmentTime <= dateTo)',
      required: false,
      example: '2024-03-21T00:00:00Z',
    }),
    ApiResponse({
      status: 200,
      description: 'Appointment found successfully',
      schema: { type: 'array', items: AppointmentResponseSchema },
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Appointment not found' }),
  )
}

export const ApiFindAppointmentByDoctorId = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Find Appointment by Doctor ID', description: 'Find Appointment by Doctor ID' }),
    ApiParam({ name: 'id', type: 'number', description: 'Doctor ID', example: 1 }),
    ApiQuery({ name: 'page', type: 'number', description: 'Page number', example: 1, required: false }),
    ApiQuery({ name: 'limit', type: 'number', description: 'Limit', example: 10, required: false }),
    ApiQuery({
      name: 'sortBy',
      type: 'string',
      description: 'Sort by',
      required: false,
      enum: ['id', 'createdAt', 'updatedAt', 'appointmentTime', 'status', 'type'],
    }),
    ApiQuery({ name: 'sortOrder', type: 'string', description: 'Sort order', required: false, enum: ['asc', 'desc'] }),
    ApiQuery({ name: 'serviceId', type: 'number', description: 'Service ID', required: false }),
    ApiQuery({
      name: 'serviceType',
      type: 'string',
      description: 'Service Type',
      required: false,
      enum: ['TEST', 'CONSULT', 'TREATMENT'],
    }),
    ApiQuery({
      name: 'status',
      type: 'string',
      description: 'Status',
      required: false,
      enum: ['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    }),
    ApiQuery({
      name: 'type',
      type: 'string',
      description: 'Appointment Type',
      required: false,
      enum: ['ONLINE', 'OFFLINE'],
    }),
    ApiQuery({
      name: 'dateFrom',
      type: 'string',
      format: 'date-time',
      description: 'Filter from date (appointmentTime >= dateFrom)',
      required: false,
      example: '2024-03-20T00:00:00Z',
    }),
    ApiQuery({
      name: 'dateTo',
      type: 'string',
      format: 'date-time',
      description: 'Filter to date (appointmentTime <= dateTo)',
      required: false,
      example: '2024-03-21T00:00:00Z',
    }),
    ApiResponse({
      status: 200,
      description: 'Appointment found successfully',
      schema: { type: 'array', items: AppointmentResponseSchema },
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Appointment not found' }),
  )
}

export const ApiFindAppointmentsPaginated = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Find All Appointments Paginated by Admin',
      description: 'Find Appointments Paginated by Admin',
    }),
    ApiQuery({ name: 'page', type: 'number', description: 'Page number', example: 1, required: false }),
    ApiQuery({ name: 'limit', type: 'number', description: 'Limit', example: 10, required: false }),
    ApiQuery({
      name: 'sortBy',
      type: 'string',
      description: 'Sort by',
      required: false,
      enum: ['id', 'createdAt', 'updatedAt', 'appointmentTime', 'status', 'type'],
    }),
    ApiQuery({ name: 'sortOrder', type: 'string', description: 'Sort order', required: false, enum: ['asc', 'desc'] }),
    ApiQuery({ name: 'serviceId', type: 'number', description: 'Service ID', required: false }),
    ApiQuery({
      name: 'serviceType',
      type: 'string',
      description: 'Service Type',
      required: false,
      enum: ['TEST', 'CONSULT', 'TREATMENT'],
    }),
    ApiQuery({
      name: 'status',
      type: 'string',
      description: 'Status',
      required: false,
      enum: ['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    }),
    ApiQuery({
      name: 'type',
      type: 'string',
      description: 'Appointment Type',
      required: false,
      enum: ['ONLINE', 'OFFLINE'],
    }),
    ApiQuery({
      name: 'dateFrom',
      type: 'string',
      format: 'date-time',
      description: 'Filter from date (appointmentTime >= dateFrom)',
      required: false,
      example: '2024-03-20T00:00:00Z',
    }),
    ApiQuery({
      name: 'dateTo',
      type: 'string',
      format: 'date-time',
      description: 'Filter to date (appointmentTime <= dateTo)',
      required: false,
      example: '2024-03-21T00:00:00Z',
    }),
    ApiResponse({
      status: 200,
      description: 'Appointments found successfully',
      schema: { type: 'array', items: AppointmentResponseSchema },
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Appointments not found' }),
  )
}

export const ApiFindAppointmentsPaginatedByStaff = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Find All Appointments Paginated by Staff',
      description: 'Find Appointments Paginated by Staff',
    }),
    ApiQuery({ name: 'page', type: 'number', description: 'Page number', example: 1, required: false }),
    ApiQuery({ name: 'limit', type: 'number', description: 'Limit', example: 10, required: false }),
    ApiQuery({
      name: 'sortBy',
      type: 'string',
      description: 'Sort by',
      required: false,
      enum: ['id', 'createdAt', 'updatedAt', 'appointmentTime', 'status', 'type'],
    }),
    ApiQuery({ name: 'sortOrder', type: 'string', description: 'Sort order', required: false, enum: ['asc', 'desc'] }),
    ApiQuery({ name: 'serviceId', type: 'number', description: 'Service ID', required: false }),
    ApiQuery({
      name: 'serviceType',
      type: 'string',
      description: 'Service Type',
      required: false,
      enum: ['TEST', 'CONSULT', 'TREATMENT'],
    }),
    ApiQuery({
      name: 'status',
      type: 'string',
      description: 'Status',
      required: false,
      enum: ['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    }),
    ApiQuery({
      name: 'type',
      type: 'string',
      description: 'Appointment Type',
      required: false,
      enum: ['ONLINE', 'OFFLINE'],
    }),
    ApiQuery({
      name: 'dateFrom',
      type: 'string',
      format: 'date-time',
      description: 'Filter from date (appointmentTime >= dateFrom)',
      required: false,
      example: '2024-03-20T00:00:00Z',
    }),
    ApiQuery({
      name: 'dateTo',
      type: 'string',
      format: 'date-time',
      description: 'Filter to date (appointmentTime <= dateTo)',
      required: false,
      example: '2024-03-21T00:00:00Z',
    }),
    ApiResponse({
      status: 200,
      description: 'Appointments found successfully',
      schema: { type: 'array', items: AppointmentResponseSchema },
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Appointments not found' }),
  )
}
