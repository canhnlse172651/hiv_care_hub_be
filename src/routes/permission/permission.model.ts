import { z } from 'zod'
import { HTTPMethod, UserStatus } from '@prisma/client'

// User Response Schema
export const UserResSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.nativeEnum(UserStatus),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  roleId: z.number()
})

// Base Permission Schema
export const PermissionSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  path: z.string().min(1),
  method: z.nativeEnum(HTTPMethod),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable()
})

// Permission Response Schema
export const PermissionResSchema = PermissionSchema.extend({
  createdBy: UserResSchema.nullable(),
  updatedBy: UserResSchema.nullable()
})

// Types derived from schemas
export type PermissionType = z.infer<typeof PermissionSchema>
export type PermissionResType = z.infer<typeof PermissionResSchema>
export type UserResType = z.infer<typeof UserResSchema>

// Create Permission Schema
export const CreatePermissionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  path: z.string().min(1),
  method: z.nativeEnum(HTTPMethod)
})

export const UpdatePermissionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  path: z.string().min(1).optional(),
  method: z.nativeEnum(HTTPMethod, {
    errorMap: () => ({ message: `Method must be one of: ${Object.values(HTTPMethod).join(', ')}` })
  }).optional(),
  isActive: z.boolean().optional()
})

export const UpdateUserPermissionsSchema = z.object({
  permissions: z.array(z.number())
})
export const QueryPermissionSchema = z.object({
  name: z.string().optional(),
  path: z.string().optional(),
  method: z.nativeEnum(HTTPMethod).optional(),
})


export type CreatePermissionType = z.infer<typeof CreatePermissionSchema>
export type UpdatePermissionType = z.infer<typeof UpdatePermissionSchema>
export type UpdateUserPermissionsType = z.infer<typeof UpdateUserPermissionsSchema>
export type QueryPermissionType = z.infer<typeof QueryPermissionSchema>
