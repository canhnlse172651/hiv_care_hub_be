import { createZodDto } from 'nestjs-zod'
import {
  RegisterBodySchema,
  LoginBodySchema,
  RefreshTokenSchema,
  LogoutSchema,
  sentOtpSchema,
  ForgotPasswordBodySchema,
  Disable2FaBodySchema,
  TwoFaResSchema,
  Setup2FaBodySchema,
  GetProfileSchema,
  UpdateProfileSchema,
} from './auth.model'

// Register DTO
export class RegisterDto extends createZodDto(RegisterBodySchema) {
  static create(data: unknown) {
    return RegisterBodySchema.parse(data)
  }
}

// Login DTO
export class LoginDto extends createZodDto(LoginBodySchema) {
  static create(data: unknown) {
    return LoginBodySchema.parse(data)
  }
}

// Refresh Token DTO
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {
  static create(data: unknown) {
    return RefreshTokenSchema.parse(data)
  }
}

// Logout DTO
export class LogoutDto extends createZodDto(LogoutSchema) {
  static create(data: unknown) {
    return LogoutSchema.parse(data)
  }
}

export class SentOtpDto extends createZodDto(sentOtpSchema) {
  static create(data: unknown) {
    return sentOtpSchema.parse(data)
  }
}

export class ForgotPasswordBodyDto extends createZodDto(ForgotPasswordBodySchema) {
  static create(data: unknown) {
    return ForgotPasswordBodySchema.parse(data)
  }
}

export class Disable2FaBodyDto extends createZodDto(Disable2FaBodySchema) {
  static create(data: unknown) {
    return Disable2FaBodySchema.parse(data)
  }
}

export class TwoFaResDto extends createZodDto(TwoFaResSchema) {
  static create(data: unknown) {
    return TwoFaResSchema.parse(data)
  }
}

export class Setup2FaDto extends createZodDto(Setup2FaBodySchema) {
  static create(data: unknown) {
    return Setup2FaBodySchema.parse(data)
  }
}

export class GetProfileDto extends createZodDto(GetProfileSchema) {
  static create(data: unknown) {
    return GetProfileSchema.parse(data)
  }
}

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {
  static create(data: unknown) {
    return UpdateProfileSchema.parse(data)
  }
}
