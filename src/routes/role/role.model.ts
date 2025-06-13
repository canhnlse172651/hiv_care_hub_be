import { z } from 'zod'
import { HTTPMethod } from '@prisma/client'

// Permission Response Schema
export const PermissionResSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  path: z.string(),
  method: z.nativeEnum(HTTPMethod),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
})

// Base Role Schema
export const RoleSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  permissions: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      description: z.string(),
      path: z.string(),
      method: z.nativeEnum(HTTPMethod),
      createdAt: z.date(),
      updatedAt: z.date(),
      createdById: z.number().nullable(),
      updatedById: z.number().nullable(),
      deletedAt: z.date().nullable(),
    }),
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Role Response Schema
export const RoleResSchema = RoleSchema.extend({
  permissions: z.array(PermissionResSchema),
})

// Create Role Schema
export const CreateRoleSchema = RoleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  permissions: z.array(z.number()), // Array of permission IDs
  createdById: z.number().nullable(),
  isActive: z.boolean().optional(),
  updatedById: z.number().nullable().optional(),
})

// Update Role Schema
export const UpdateRoleSchema = CreateRoleSchema.partial()

// Types
export type RoleType = z.infer<typeof RoleSchema>
export type RoleResType = z.infer<typeof RoleResSchema>
export type PermissionResType = z.infer<typeof PermissionResSchema>
export type CreateRoleType = z.infer<typeof CreateRoleSchema>
export type UpdateRoleType = z.infer<typeof UpdateRoleSchema>

// Query Role Schema
export const QueryRoleSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type QueryRoleType = z.infer<typeof QueryRoleSchema>

// Update Role Permissions Schema
export const UpdateRolePermissionsSchema = z.object({
  permissions: z.array(z.number()),
})

export type UpdateRolePermissionsType = z.infer<typeof UpdateRolePermissionsSchema>

// Update User Roles Schema
export const UpdateUserRolesSchema = z.object({
  roles: z.array(z.number()),
})

export type UpdateUserRolesType = z.infer<typeof UpdateUserRolesSchema>

// Update User Role Schema
export const UpdateUserRoleSchema = z.object({
  roleId: z.number(),
})

export type UpdateUserRoleType = z.infer<typeof UpdateUserRoleSchema>
