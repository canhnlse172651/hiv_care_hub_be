import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

// User Response Schema
export const UserResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    email: { type: 'string', example: 'user@example.com' },
    name: { type: 'string', example: 'John Doe' },
    phoneNumber: { type: 'string', example: '+1234567890' },
    roleId: { type: 'number', example: 1 },
    status: { type: 'string', enum: Object.values(UserStatus), example: UserStatus.ACTIVE },
    avatar: { type: 'string', nullable: true, example: null },
    createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' }
  }
};

export const ApiGetAllUsers = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all users with pagination and search' }),
    // Pagination parameters
    ApiQuery({ 
      name: 'page', 
      required: false, 
      type: Number, 
      description: 'Page number (default: 1)',
      example: 1,
      schema: {
        type: 'number',
        minimum: 1,
        default: 1
      }
    }),
    ApiQuery({ 
      name: 'limit', 
      required: false, 
      type: Number, 
      description: 'Number of items per page (default: 10)',
      example: 10,
      schema: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 10
      }
    }),
    ApiQuery({ 
      name: 'sortBy', 
      required: false, 
      type: String, 
      description: 'Field to sort by (e.g., email, name, createdAt)',
      example: 'createdAt',
      schema: {
        type: 'string',
        enum: ['email', 'name', 'createdAt', 'updatedAt']
      }
    }),
    ApiQuery({ 
      name: 'sortOrder', 
      required: false, 
      enum: ['asc', 'desc'], 
      description: 'Sort order (default: desc)',
      example: 'desc',
      schema: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    }),
    // Search parameters
    ApiQuery({ 
      name: 'search', 
      required: false, 
      type: String, 
      description: 'Search term to filter users by name, email, or phone number',
      example: 'john',
      schema: {
        type: 'string',
        minLength: 1
      }
    }),
    // Filter parameters
    ApiQuery({ 
      name: 'filters', 
      required: false, 
      type: String, 
      description: 'JSON string of filters (e.g. {"roleId": 1, "status": "ACTIVE"})',
      example: '{"roleId": 1, "status": "ACTIVE"}',
      schema: {
        type: 'string',
        example: '{"roleId": 1, "status": "ACTIVE"}'
      }
    }),
    // Response documentation
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved users',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: UserResponseSchema
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 25 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 3 },
              hasNextPage: { type: 'boolean', example: true },
              hasPreviousPage: { type: 'boolean', example: false }
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid query parameters'
    })
  );
};

export const ApiGetUserById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get user by ID' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiResponse({
      status: 200,
      description: 'Return user by ID',
      schema: UserResponseSchema
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    }),
    ApiResponse({
      status: 404,
      description: 'User not found'
    })
  );
};

export const ApiCreateUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create new user' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['email', 'name', 'roleId'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com'
          },
          name: {
            type: 'string',
            description: 'User full name',
            example: 'John Doe'
          },
          phoneNumber: {
            type: 'string',
            description: 'User phone number',
            example: '+1234567890'
          },
          roleId: {
            type: 'number',
            description: 'ID of the role assigned to user',
            example: 1
          }
        }
      }
    }),
    ApiResponse({
      status: 201,
      description: 'User created successfully',
      schema: UserResponseSchema
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Email already exists'
    })
  );
};

export const ApiUpdateUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update user' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'User full name',
            example: 'John Doe'
          },
          phoneNumber: {
            type: 'string',
            description: 'User phone number',
            example: '+1234567890'
          },
          avatar: {
            type: 'string',
            description: 'URL to user avatar image',
            example: 'https://example.com/avatar.jpg',
            nullable: true
          },
          status: {
            type: 'string',
            enum: Object.values(UserStatus),
            description: 'User status',
            example: UserStatus.ACTIVE
          },
          roleId: {
            type: 'number',
            description: 'ID of the role assigned to user',
            example: 1
          }
        }
      }
    }),
    ApiResponse({
      status: 200,
      description: 'User updated successfully',
      schema: UserResponseSchema
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    }),
    ApiResponse({
      status: 404,
      description: 'User not found'
    })
  );
};

export const ApiDeleteUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete user' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiResponse({
      status: 200,
      description: 'User deleted successfully'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    }),
    ApiResponse({
      status: 404,
      description: 'User not found'
    })
  );
};

export const ApiRestoreUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Restore deleted user' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiResponse({
      status: 200,
      description: 'User restored successfully',
      schema: UserResponseSchema
    }),
    ApiResponse({
      status: 400,
      description: 'User is not deleted'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    }),
    ApiResponse({
      status: 404,
      description: 'User not found'
    })
  );
};
