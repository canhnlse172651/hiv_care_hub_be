import { createZodDto } from 'nestjs-zod';
import { RegisterBodySchema, LoginBodySchema, RefreshTokenSchema, LogoutSchema, sentOtpSchema, ForgotPasswordBodySchema } from './auth.model';

// Register DTO
export class RegisterDto extends createZodDto(RegisterBodySchema) {
  static create(data: unknown) {
    return RegisterBodySchema.parse(data);
  }
}

// Login DTO
export class LoginDto extends createZodDto(LoginBodySchema) {
  static create(data: unknown) {
    return LoginBodySchema.parse(data);
  }
}

// Refresh Token DTO
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {
  static create(data: unknown) {
    return RefreshTokenSchema.parse(data);
  }
}

// Logout DTO
export class LogoutDto extends createZodDto(LogoutSchema) {
  static create(data: unknown) {
    return LogoutSchema.parse(data);
  }
}


export class SentOtpDto extends createZodDto(sentOtpSchema) {
  static create(data: unknown) {
    return sentOtpSchema.parse(data);
  }
}



export class ForgotPasswordBodyDto extends createZodDto(ForgotPasswordBodySchema) {
  static create(data: unknown) {
    return ForgotPasswordBodySchema.parse(data);
  }
}



