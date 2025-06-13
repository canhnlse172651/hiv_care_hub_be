import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { HTTPMethod } from '@prisma/client'

// Swagger schemas
export const PermissionResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    description: { type: 'string' },
    path: { type: 'string' },
    method: { type: 'string', enum: Object.values(HTTPMethod) },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    createdById: { type: 'number', nullable: true },
    updatedById: { type: 'number', nullable: true },
    deletedAt: { type: 'string', format: 'date-time', nullable: true }
  }
}

export const RoleResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    description: { type: 'string' },
    permissions: { 
      type: 'array',
      items: PermissionResponseSchema
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
}

export const CreateRoleBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', minLength: 1, maxLength: 500 },
    permissions: { 
      type: 'array',
      items: { type: 'number' }
    },
    createdById: { type: 'number', nullable: true },
    isActive: { type: 'boolean' },
    updatedById: { type: 'number', nullable: true }
  },
  required: ['name', 'description', 'permissions']
}

export const UpdateRoleBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', minLength: 1, maxLength: 500 },
    permissions: { 
      type: 'array',
      items: { type: 'number' }
    },
    createdById: { type: 'number', nullable: true },
    isActive: { type: 'boolean' },
    updatedById: { type: 'number', nullable: true }
  }
}

export const UpdateRolePermissionsBodySchema = {
  type: 'object',
  properties: {
    permissions: { 
      type: 'array',
      items: { type: 'number' }
    }
  },
  required: ['permissions']
}

export const UpdateUserRoleBodySchema = {
  type: 'object',
  properties: {
    roleId: { 
      type: 'number',
      description: 'Role ID to assign to user',
      example: 1
    }
  },
  required: ['roleId']
}

// Decorators
export const ApiGetAllRoles = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all roles with pagination and search' }),
    // Pagination parameters
    ApiQuery({ 
      name: 'page', 
      required: false, 
      type: Number, 
      description: 'Page number (default: 1). Must be a number.',
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
      description: 'Number of items per page (default: 10). Must be a number.',
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
      example: 'name',
      schema: {
        type: 'string',
        enum: ['name', 'createdAt', 'updatedAt']
      }
    }),
    ApiQuery({ 
      name: 'sortOrder', 
      required: false, 
      enum: ['asc', 'desc'], 
      description: 'Sort order (default: desc)',
      example: 'asc',
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
      description: 'Search term to filter roles',
      example: 'admin',
      schema: {
        type: 'string',
        minLength: 1
      }
    }),
   
    // Response documentation
    ApiResponse({
      status: 200,
      description: 'Return paginated roles',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: RoleResponseSchema
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
  )
}

export const ApiGetRoleById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get role by ID' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Role ID',
      example: 1
    }),
    ApiResponse({
      status: 200,
      description: 'Return role by ID',
      schema: RoleResponseSchema
    }),
    ApiResponse({
      status: 404,
      description: 'Role not found'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    })
  )
}

export const ApiCreateRole = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create new role' }),
    ApiBody({
      schema: CreateRoleBodySchema,
      examples: {
        example1: {
          value: {
            name: 'Admin',
            description: 'Administrator role with full access',
            permissions: [1, 2, 3],
            createdById: 1,
            isActive: true
          },
          summary: 'Create Admin role'
        },
        example2: {
          value: {
            name: 'Doctor',
            description: 'Doctor role with medical access',
            permissions: [1, 2, 4],
            createdById: 1,
            isActive: true
          },
          summary: 'Create Doctor role'
        }
      }
    }),
    ApiResponse({
      status: 201,
      description: 'Role created successfully',
      schema: RoleResponseSchema
    }),
    ApiResponse({ 
      status: 409, 
      description: 'Role name already exists' 
    }),
    ApiResponse({ 
      status: 400, 
      description: 'Invalid request body' 
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    })
  )
}

export const ApiUpdateRole = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update role' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Role ID',
      example: 1
    }),
    ApiBody({
      schema: UpdateRoleBodySchema,
      examples: {
        example1: {
          value: {
            name: 'Updated Admin',
            description: 'Updated administrator role',
            permissions: [1, 2, 3, 4],
            isActive: true,
            updatedById: 1
          },
          summary: 'Update Admin role'
        },
        example2: {
          value: {
            name: 'Updated Doctor',
            description: 'Updated doctor role',
            permissions: [1, 2, 4, 5],
            isActive: true,
            updatedById: 1
          },
          summary: 'Update Doctor role'
        }
      }
    }),
    ApiResponse({
      status: 200,
      description: 'Role updated successfully',
      schema: RoleResponseSchema
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Role not found' 
    }),
    ApiResponse({ 
      status: 409, 
      description: 'Role name already exists' 
    }),
    ApiResponse({ 
      status: 400, 
      description: 'Invalid request body' 
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    })
  )
}

export const ApiDeleteRole = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete role' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Role ID',
      example: 1
    }),
    ApiResponse({
      status: 200,
      description: 'Role deleted successfully',
      schema: RoleResponseSchema
    }),
    ApiResponse({
      status: 404,
      description: 'Role not found'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    })
  )
}

export const ApiGetUserRoles = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get user roles' }),
    ApiParam({
      name: 'userId',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiResponse({
      status: 200,
      description: 'Return user roles',
      schema: {
        type: 'array',
        items: RoleResponseSchema
      }
    }),
    ApiResponse({
      status: 404,
      description: 'User not found'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    })
  )
}

export const ApiAddRolesToUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Add roles to user' }),
    ApiParam({
      name: 'userId',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          roleIds: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of role IDs to add',
            example: [1, 2]
          }
        },
        required: ['roleIds']
      }
    }),
    ApiResponse({
      status: 200,
      description: 'Roles added successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          email: { type: 'string', example: 'user@example.com' },
          roles: {
            type: 'array',
            items: RoleResponseSchema
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'User or role not found'
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid request body'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    })
  )
}

export const ApiRemoveRolesFromUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Remove roles from user' }),
    ApiParam({
      name: 'userId',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          roleIds: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of role IDs to remove',
            example: [1, 2]
          }
        },
        required: ['roleIds']
      }
    }),
    ApiResponse({
      status: 200,
      description: 'Roles removed successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          email: { type: 'string', example: 'user@example.com' },
          roles: {
            type: 'array',
            items: RoleResponseSchema
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'User or role not found'
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid request body'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    })
  )
}

export const ApiAddPermissionsToRole = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Add permissions to role' }),
    ApiParam({ 
      name: 'id', 
      type: 'number',
      description: 'Role ID',
      example: 1
    }),
    ApiBody({ 
      schema: UpdateRolePermissionsBodySchema,
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
      schema: RoleResponseSchema
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Role not found' 
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid request body'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    }),
    ApiBearerAuth()
  )
}

export const ApiRemovePermissionsFromRole = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Remove permissions from role' }),
    ApiParam({ 
      name: 'id', 
      type: 'number',
      description: 'Role ID',
      example: 1
    }),
    ApiBody({ 
      schema: UpdateRolePermissionsBodySchema,
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
      schema: RoleResponseSchema
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Role not found' 
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid request body'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    }),
    ApiBearerAuth()
  )
}

export const ApiUpdateUserRole = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update user role' }),
    ApiParam({
      name: 'userId',
      type: 'number',
      description: 'User ID',
      example: 1
    }),
    ApiBody({ 
      schema: UpdateUserRoleBodySchema,
      examples: {
        example1: {
          value: {
            roleId: 1
          },
          summary: 'Assign Admin role'
        },
        example2: {
          value: {
            roleId: 2
          },
          summary: 'Assign Client role'
        }
      }
    }),
    ApiResponse({
      status: 200,
      description: 'User role updated successfully',
      schema: RoleResponseSchema
    }),
    ApiResponse({ 
      status: 404, 
      description: 'User or role not found' 
    }),
    ApiResponse({ 
      status: 400, 
      description: 'Invalid request body' 
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions'
    })
  )
}

export const RoleSwagger = {
  tags: 'Roles',
  getAll: {
    operation: ApiOperation({ summary: 'Get all roles' }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Returns all roles',
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: RoleResponseSchema
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
    ]
  },
  getById: {
    operation: ApiOperation({ summary: 'Get role by ID' }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Returns the role',
        schema: RoleResponseSchema
      }),
      ApiResponse({ 
        status: 404, 
        description: 'Role not found' 
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized'
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions'
      })
    ]
  },
  create: {
    operation: ApiOperation({ summary: 'Create new role' }),
    responses: [
      ApiResponse({ 
        status: 201, 
        description: 'Role created successfully',
        schema: RoleResponseSchema
      }),
      ApiResponse({ 
        status: 409, 
        description: 'Role name already exists' 
      }),
      ApiResponse({ 
        status: 400, 
        description: 'Invalid request body' 
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized'
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions'
      })
    ]
  },
  update: {
    operation: ApiOperation({ summary: 'Update role' }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Role updated successfully',
        schema: RoleResponseSchema
      }),
      ApiResponse({ 
        status: 404, 
        description: 'Role not found' 
      }),
      ApiResponse({ 
        status: 409, 
        description: 'Role name already exists' 
      }),
      ApiResponse({ 
        status: 400, 
        description: 'Invalid request body' 
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized'
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions'
      })
    ]
  },
  delete: {
    operation: ApiOperation({ summary: 'Delete role' }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Role deleted successfully',
        schema: RoleResponseSchema
      }),
      ApiResponse({ 
        status: 404, 
        description: 'Role not found' 
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized'
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions'
      })
    ]
  },
  addPermissions: {
    operation: ApiOperation({ summary: 'Add permissions to role' }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Permissions added successfully',
        schema: RoleResponseSchema
      }),
      ApiResponse({ 
        status: 404, 
        description: 'Role not found' 
      }),
      ApiResponse({
        status: 400,
        description: 'Invalid request body'
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized'
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions'
      })
    ]
  },
  removePermissions: {
    operation: ApiOperation({ summary: 'Remove permissions from role' }),
    responses: [
      ApiResponse({ 
        status: 200, 
        description: 'Permissions removed successfully',
        schema: RoleResponseSchema
      }),
      ApiResponse({ 
        status: 404, 
        description: 'Role not found' 
      }),
      ApiResponse({
        status: 400,
        description: 'Invalid request body'
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized'
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions'
      })
    ]
  }
}
