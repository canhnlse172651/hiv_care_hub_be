import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import {  HTTPMethod } from '@prisma/client';
import { PermissionResponseSchema } from './role.swagger'

export const ApiGetAllPermissions = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all permissions with pagination and search' }),
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
      description: 'Field to sort by (e.g., name, createdAt)',
      example: 'createdAt',
      schema: {
        type: 'string',
        enum: ['name', 'path', 'method', 'createdAt', 'updatedAt']
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
      description: 'Search term to filter permissions by name',
      example: 'user',
      schema: {
        type: 'string',
        minLength: 1
      }
    }),
    // Filter parameters
    ApiQuery({ 
      name: 'method', 
      required: false, 
      enum: Object.values(HTTPMethod), 
      description: 'Filter by HTTP method',
      example: 'GET',
      schema: {
        type: 'string',
        enum: Object.values(HTTPMethod)
      }
    }),
    // Response documentation
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved permissions',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: PermissionResponseSchema
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

export const ApiGetPermissionById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get permission by ID' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Permission ID',
      example: 1
    }),
    ApiResponse({
      status: 200,
      description: 'Return permission by ID',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Create User' },
          description: { type: 'string', example: 'Permission to create new user' },
          resource: { type: 'string', example: '/users' },
          action: { type: 'string', example: 'POST' },
          createdAt: { type: 'string', example: '2024-03-20T10:00:00Z' },
          updatedAt: { type: 'string', example: '2024-03-20T10:00:00Z' }
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
      status: 404,
      description: 'Permission not found'
    })
  );
};

export const ApiCreatePermission = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create new permission' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['path', 'method', 'description'],
        properties: {
          path: {
            type: 'string',
            description: 'API path that this permission controls',
            example: '/users'
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'HTTP method that this permission controls',
            example: 'GET'
          },
          description: {
            type: 'string',
            description: 'Description of what this permission allows',
            example: 'Allows viewing user list'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether this permission is active',
            default: true,
            example: true
          },
          name : {
            type: 'string',
            description: 'Name of the permission',
            example: 'View Users'
          }
        }
      },
      examples: {
        example1: {
          value: {
            path: '/users',
            method: 'GET',
            description: 'Allows viewing user list',
            isActive: true
          },
          summary: 'Create view users permission'
        },
        example2: {
          value: {
            path: '/roles',
            method: 'POST',
            description: 'Allows creating new roles',
            isActive: true
          },
          summary: 'Create create role permission'
        }
      }
    }),
    ApiResponse({
      status: 201,
      description: 'Permission created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          path: { type: 'string', example: '/users' },
          method: { type: 'string', example: 'GET' },
          description: { type: 'string', example: 'Allows viewing user list' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }),
    ApiResponse({ 
      status: 409, 
      description: 'Permission with this path and method already exists' 
    }),
    ApiResponse({ 
      status: 400, 
      description: 'Invalid request body' 
    })
  );
};

export const ApiUpdatePermission = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update permission' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Permission ID',
      example: 1
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'API path that this permission controls',
            example: '/users'
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'HTTP method that this permission controls',
            example: 'GET'
          },
          description: {
            type: 'string',
            description: 'Description of what this permission allows',
            example: 'Allows viewing user list'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether this permission is active',
            example: true
          }
        }
      },
      examples: {
        example1: {
          value: {
            path: '/users',
            method: 'GET',
            description: 'Updated description for viewing users',
            isActive: true
          },
          summary: 'Update view users permission'
        }
      }
    }),
    ApiResponse({
      status: 200,
      description: 'Permission updated successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'GET users' },
          path: { type: 'string', example: '/users' },
          method: { type: 'string', example: 'GET' },
          description: { type: 'string', example: 'Updated description for viewing users' },
          isActive: { type: 'boolean', example: true },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Permission not found' 
    }),
    ApiResponse({ 
      status: 409, 
      description: 'Permission with this path and method already exists' 
    })
  );
};

export const ApiDeletePermission = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete permission' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Permission ID',
      example: 1
    }),
    ApiResponse({
      status: 200,
      description: 'Permission deleted successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Deleted Permission' },
          description: { type: 'string', example: 'Permission description' },
          resource: { type: 'string', example: '/users' },
          action: { type: 'string', example: 'POST' },
          createdAt: { type: 'string', example: '2024-03-20T10:00:00Z' },
          updatedAt: { type: 'string', example: '2024-03-20T10:00:00Z' }
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
      status: 404,
      description: 'Permission not found'
    })
  );
};

export const ApiCheckPermission = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Check if permission exists' }),
    ApiParam({
      name: 'path',
      type: 'string',
      description: 'Resource path',
      example: '/users'
    }),
    ApiParam({
      name: 'method',
      type: 'string',
      description: 'HTTP method',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      example: 'GET'
    }),
    ApiResponse({
      status: 200,
      description: 'Permission exists',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Get Users' },
          description: { type: 'string', example: 'Permission to get users' },
          resource: { type: 'string', example: '/users' },
          action: { type: 'string', example: 'GET' },
          createdAt: { type: 'string', example: '2024-03-20T10:00:00Z' },
          updatedAt: { type: 'string', example: '2024-03-20T10:00:00Z' }
        }
      }
    }),
    ApiResponse({
      status: 200,
      description: 'Permission does not exist',
      schema: {
        type: 'null'
      }
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    })
  );
};

export const ApiGetUserPermissions = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get user permissions' }),
    ApiParam({
      name: 'userId',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiResponse({
      status: 200,
      description: 'Return user permissions',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Create User' },
            description: { type: 'string', example: 'Permission to create new user' },
            resource: { type: 'string', example: '/users' },
            action: { type: 'string', example: 'POST' },
            createdAt: { type: 'string', example: '2024-03-20T10:00:00Z' },
            updatedAt: { type: 'string', example: '2024-03-20T10:00:00Z' }
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
      status: 404,
      description: 'User not found'
    })
  );
};

export const ApiAddPermissionsToUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Add permissions to user' }),
    ApiParam({
      name: 'userId',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['permissions'],
        properties: {
          permissions: {
            type: 'array',
            items: {
              type: 'number'
            },
            description: 'Array of permission IDs to add',
            example: [1, 2, 3]
          }
        }
      },
      examples: {
        example1: {
          value: {
            permissions: [1, 2, 3]
          },
          summary: 'Add multiple permissions'
        }
      }
    }),
    ApiResponse({
      status: 200,
      description: 'Permissions added successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'GET users' },
            path: { type: 'string', example: '/users' },
            method: { type: 'string', example: 'GET' },
            description: { type: 'string', example: 'Allows viewing user list' }
          }
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'User not found' 
    })
  );
};

export const ApiRemovePermissionsFromUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Remove permissions from user' }),
    ApiParam({
      name: 'userId',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['permissions'],
        properties: {
          permissions: {
            type: 'array',
            items: {
              type: 'number'
            },
            description: 'Array of permission IDs to remove',
            example: [1, 2, 3]
          }
        }
      },
      examples: {
        example1: {
          value: {
            permissions: [1, 2, 3]
          },
          summary: 'Remove multiple permissions'
        }
      }
    }),
    ApiResponse({
      status: 200,
      description: 'Permissions removed successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'GET users' },
            path: { type: 'string', example: '/users' },
            method: { type: 'string', example: 'GET' },
            description: { type: 'string', example: 'Allows viewing user list' }
          }
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'User not found' 
    })
  );
}; 