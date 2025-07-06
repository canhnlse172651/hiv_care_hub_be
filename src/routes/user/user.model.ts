import { z } from 'zod'
import { UserStatus } from '@prisma/client'


// Base User Schema
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(3).max(100),
  phoneNumber: z.string().min(9).max(15),
  avatar: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
  roleId: z.number().positive(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Create User Schema
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3).max(100).optional(),
  password: z.string().min(6).max(100).optional(),
  phoneNumber: z.string().min(9).max(15).optional(),
  roleId: z.number().positive(),
})

// Update User Schema
export const UpdateUserSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  phoneNumber: z.string().min(9).max(15).optional(),
  avatar: z.string().nullable().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  roleId: z.number().positive().optional(),
})

// User Response Schema
export const UserResSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  phoneNumber: z.string(),
  avatar: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
  roleId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  totpSecret: z.string().nullable(),
})

// Query User Schema
export const QueryUserSchema = z.object({
  search: z.string().optional(),
  searchFields: z
    .array(z.enum(['name', 'email', 'phoneNumber']))
    .optional()
    .default(['name', 'email', 'phoneNumber']),
  // Thêm các trường tìm kiếm khác nếu cần
  status: z.nativeEnum(UserStatus).optional(),
  roleId: z.number().positive().optional(),
})


