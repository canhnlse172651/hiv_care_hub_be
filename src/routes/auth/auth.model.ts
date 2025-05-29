import { UserStatus } from '@prisma/client'
import { z } from 'zod'

// Base User Schema
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(3).max(100),
  password: z.string().min(6).max(100).nonempty("password is required"),
  phoneNumber: z.string().min(9).max(15).nonempty("phoneNumber is required"),
  avatar: z.string().nullable(),
  totpSecret: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
  roleId: z.number().positive(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Types derived from schemas
export type UserType = z.infer<typeof UserSchema>

export type UserResType = z.infer<typeof UserSchema>

// Register Schema
export const RegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(3).max(100),
  phoneNumber: z.string().min(9).max(15),
  confirmPassword: z.string().min(6).max(100),
})
  .strict()
 
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password must match',
        path: ['confirmPassword'],
      })
    }
  })
  

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>

// Register Response Schema
export const RegisterResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
})

export type RegisterResType = z.infer<typeof RegisterResSchema>

// Login Schema
export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginBodyType = z.infer<typeof LoginBodySchema>

// Login Response Schema
export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export type LoginResType = z.infer<typeof LoginResSchema>

// Refresh Token Schema
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
})

export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>

// Logout Schema
export const LogoutSchema = z.object({
  refreshToken: z.string().min(1)
})

export type LogoutType = z.infer<typeof LogoutSchema>
