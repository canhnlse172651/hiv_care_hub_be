import { UserStatus } from '@prisma/client'
import e from 'express'
import { z } from 'zod'

// Base User Schema
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(3).max(100),
  password: z.string().min(6).max(100).nonempty('password is required'),
  phoneNumber: z.string().min(9).max(15).nonempty('phoneNumber is required'),
  avatar: z.string().nullable(),
  totpSecret: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
  roleId: z.number().positive(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: z
    .object({
      name: z.string(),
    })
    .optional(),
})

// Register Schema
export const RegisterBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    name: z.string().min(3).max(100),
    phoneNumber: z.string().min(9).max(15),
    confirmPassword: z.string().min(6).max(100),
    code: z.string().min(6).max(6),
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

// Register Response Schema
export const RegisterResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
})

// Login Schema
export const LoginBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
    totpCode: z.string().length(6).nullable().optional(), // 2FA
    code: z.string().length(6).nullable().optional(), // OTP FORM EMAIL
  })
  .superRefine(({ totpCode, code }, ctx) => {
    if (totpCode && code) {
      ctx.addIssue({
        code: 'custom',
        message: 'Không thể cùng lúc nhập mã OTP từ email và mã OTP từ 2FA',
      })
    }
  })
// Login Response Schema
export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

// Refresh Token Schema
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

// Logout Schema
export const LogoutSchema = z.object({
  refreshToken: z.string().min(1),
})

//get profile schema
export const GetProfileSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(3).max(100),
  phoneNumber: z.string().min(9).max(15).nonempty('phoneNumber is required'),
  avatar: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
  roleId: z.number().positive(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: z
    .object({
      name: z.string(),
    })
    .optional(),
})

//update profile schema
export const UpdateProfileSchema = z
  .object({
    name: z.string().min(3).max(100).optional(),
    phoneNumber: z.string().min(9).max(15).optional(),
    avatar: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export type LogoutType = z.infer<typeof LogoutSchema>

export const VerificationCodeSchema = z.object({
  id: z.number(),
  code: z.string().min(6).max(6),
  email: z.string().email(),
  type: z.enum(['FORGOT_PASSWORD', 'REGISTER', 'DISABLE_2FA', 'LOGIN']),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const sentOtpSchema = VerificationCodeSchema.pick({
  email: true,
  type: true,
}).strict()

export const GoogleAuthRedirectUrlSchema = z.object({
  url: z.string(),
})

export const ForgotPasswordBodySchema = z
  .object({
    email: z.string().email(),
    code: z.string().length(6),
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(6).max(100),
  })
  .strict()
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu và mật khẩu xác nhận phải giống nhau',
        path: ['confirmNewPassword'],
      })
    }
  })

export const Disable2FaBodySchema = z
  .object({
    code: z.string().length(6).optional(),
    totpCode: z.string().length(6).optional(),
  })
  .superRefine(({ code, totpCode }, ctx) => {
    if (code !== undefined && totpCode !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Không thể cùng lúc nhập mã OTP từ email và mã OTP từ 2FA',
        path: ['totpCode'],
      })
      ctx.addIssue({
        code: 'custom',
        message: 'Không thể cùng lúc nhập mã OTP từ email và mã OTP từ 2FA',
        path: ['code'],
      })
    }
  })

export const TwoFaResSchema = z.object({
  secret: z.string(),
  url: z.string(),
})

export const Setup2FaBodySchema = z.object({
  userId: z.number().positive(),
})

export type Disable2FaBodyType = z.infer<typeof Disable2FaBodySchema>
export type Setup2FaBodyType = z.infer<typeof Setup2FaBodySchema>

// Types derived from schemas
export type UserType = z.infer<typeof UserSchema>
export type UserResType = z.infer<typeof RegisterResSchema>
export type UserWithPasswordType = z.infer<typeof UserSchema>
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>
export type GoogleAuthRedirectUrlType = z.infer<typeof GoogleAuthRedirectUrlSchema>
export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>
export type SentOtpType = z.infer<typeof sentOtpSchema>
export type LoginResType = z.infer<typeof LoginResSchema>
export type LoginBodyType = z.infer<typeof LoginBodySchema>
export type RegisterResType = z.infer<typeof RegisterResSchema>
export type RegisterBodyType = z.infer<typeof RegisterBodySchema>
export type TwoFaResType = z.infer<typeof TwoFaResSchema>
export type GetProfileType = z.infer<typeof GetProfileSchema>
export type UpdateProfileType = z.infer<typeof UpdateProfileSchema>
