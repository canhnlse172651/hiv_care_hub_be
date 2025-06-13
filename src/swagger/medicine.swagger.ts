import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'

export const ApiGetAllMedicines = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all medicines',
      description: 'Retrieve a paginated list of all medicines with optional filtering',
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
      description: 'Search query for medicine name or description',
      type: String,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Field to sort by',
      enum: ['name', 'price', 'createdAt'],
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order',
      enum: ['asc', 'desc'],
    }),
    ApiResponse({
      status: 200,
      description: 'Medicines retrieved successfully',
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

export const ApiGetMedicineById = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get medicine by ID',
      description: 'Retrieve a specific medicine by its ID',
    }),
    ApiParam({
      name: 'id',
      description: 'Medicine ID',
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: 'Medicine retrieved successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Medicine not found',
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

export const ApiCreateMedicine = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create new medicine',
      description: 'Create a new medicine entry',
    }),
    ApiBody({
      description: 'Medicine data',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Medicine name',
            example: 'Efavirenz',
          },
          description: {
            type: 'string',
            description: 'Medicine description',
            example: 'Antiretroviral medication for HIV treatment',
          },
          unit: {
            type: 'string',
            description: 'Medicine unit',
            example: 'mg',
          },
          dose: {
            type: 'string',
            description: 'Medicine dose',
            example: '600mg',
          },
          price: {
            type: 'number',
            description: 'Medicine price',
            example: 25.5,
          },
        },
        required: ['name', 'unit', 'dose', 'price'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Medicine created successfully',
    }),
    ApiResponse({
      status: 409,
      description: 'Medicine with this name already exists',
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

export const ApiUpdateMedicine = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update medicine',
      description: 'Update an existing medicine',
    }),
    ApiParam({
      name: 'id',
      description: 'Medicine ID',
      type: Number,
    }),
    ApiBody({
      description: 'Updated medicine data',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Medicine name',
            example: 'Efavirenz',
          },
          description: {
            type: 'string',
            description: 'Medicine description',
            example: 'Antiretroviral medication for HIV treatment',
          },
          unit: {
            type: 'string',
            description: 'Medicine unit',
            example: 'mg',
          },
          dose: {
            type: 'string',
            description: 'Medicine dose',
            example: '600mg',
          },
          price: {
            type: 'number',
            description: 'Medicine price',
            example: 25.5,
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Medicine updated successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Medicine not found',
    }),
    ApiResponse({
      status: 409,
      description: 'Medicine with this name already exists',
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

export const ApiDeleteMedicine = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete medicine',
      description: 'Delete an existing medicine',
    }),
    ApiParam({
      name: 'id',
      description: 'Medicine ID',
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: 'Medicine deleted successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Medicine not found',
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

export const ApiSearchMedicines = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Search medicines',
      description: 'Search medicines by name or description',
    }),
    ApiQuery({
      name: 'q',
      description: 'Search query',
      type: String,
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Medicines found successfully',
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
