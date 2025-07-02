import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiQuery} from '@nestjs/swagger'
import { LoginBodySchema, RefreshTokenSchema, LogoutSchema, sentOtpSchema, ForgotPasswordBodySchema } from '../routes/auth/auth.model'
import { zodToSwagger } from '../shared/utils/zod-to-swagger'

// Swagger schemas
export const UserResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    email: { type: 'string', example: 'user@example.com' },
    name: { type: 'string', example: 'John Doe' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
}

export const LoginResponseSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
  }
}

// Decorators
export const ApiRegister = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new user' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['email', 'password', 'name', 'phoneNumber', 'confirmPassword'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'canh@gmail.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            example: '123456'
          },
          name: {
            type: 'string',
            example: 'canh'
          },
          phoneNumber: {
            type: 'string',
            minLength: 9,
            maxLength: 15,
            example: '0353366459'
          },
          confirmPassword: {
            type: 'string',
            minLength: 6,
            example: '123456'
          }
        }
      }
    }),
    ApiResponse({ 
      status: 201, 
      description: 'User successfully registered',
      schema: UserResponseSchema
    }),
    ApiResponse({ status: 409, description: 'Email already exists' })
  )
}

export const ApiLogin = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Login user' }),
    ApiBody({ schema: zodToSwagger(LoginBodySchema) }),
    ApiResponse({ 
      status: 200, 
      description: 'User successfully logged in',
      schema: LoginResponseSchema
    }),
    ApiResponse({ status: 401, description: 'Invalid credentials' }),
    ApiResponse({ status: 422, description: 'Password is incorrect' })
  )
}

export const ApiRefreshToken = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Refresh access token' }),
    ApiBody({ schema: zodToSwagger(RefreshTokenSchema) }),
    ApiResponse({ 
      status: 200, 
      description: 'Token refreshed successfully',
      schema: LoginResponseSchema
    }),
    ApiResponse({ status: 401, description: 'Invalid refresh token' })
  )
}

export const ApiLogout = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Logout user' }),
    ApiBody({ schema: zodToSwagger(LogoutSchema) }),
    ApiResponse({ 
      status: 200, 
      description: 'User successfully logged out'
    }),
    ApiResponse({ status: 401, description: 'Invalid refresh token' })
  )
}

export const ApiSentOtp = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Send OTP to email for registration' }),
    ApiBody({ schema: zodToSwagger(sentOtpSchema) }),
    ApiResponse({ 
      status: 200, 
      description: 'OTP sent successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'OTP sent successfully to your email' },
          email: { type: 'string', example: 'user@example.com' },
          type: { type: 'string', enum: ['REGISTER', 'FORGOT_PASSWORD'], example: 'REGISTER' }
        }
      }
    }),
    ApiResponse({ status: 409, description: 'Email already exists' })
  )
}

export const ApiGoogleLink = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get Google OAuth authorization URL' }),
    ApiResponse({ 
      status: 200, 
      description: 'Google OAuth URL generated successfully',
      schema: {
        type: 'object',
        properties: {
          url: { type: 'string', example: 'https://accounts.google.com/o/oauth2/auth?...' }
        }
      }
    })
  )
}

export const ApiGoogleCallback = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Handle Google OAuth callback' }),
    ApiQuery({ name: 'code', description: 'Authorization code from Google', example: '4/0AfJohXn...' }),
    ApiQuery({ name: 'state', description: 'State parameter for CSRF protection', example: 'abc123...' }),
    ApiResponse({ 
      status: 200, 
      description: 'Google login successful',
      schema: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john@example.com' },
              role: { type: 'string', example: 'PATIENT' },
              avatar: { type: 'string', example: 'https://lh3.googleusercontent.com/...' }
            }
          },
          isNewUser: { type: 'boolean', example: false }
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Invalid authorization code' }),
    ApiResponse({ status: 401, description: 'Google authentication failed' })
  )
}

export const ApiForgotPassword = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Reset password using OTP' }),
    ApiBody({ schema: zodToSwagger(ForgotPasswordBodySchema) }),
    ApiResponse({ 
      status: 200, 
      description: 'Password changed successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Change password successfully' }
        }
      }
    }),
    ApiResponse({ status: 404, description: 'Email not found' }),
    ApiResponse({ status: 422, description: 'Invalid OTP code' })
  )
}

export const ApiSetup2FA = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Setup Two-Factor Authentication' }),
    ApiResponse({ 
      status: 200, 
      description: '2FA setup successful',
      schema: {
        type: 'object',
        properties: {
          secret: { 
            type: 'string', 
            example: 'JBSWY3DPEHPK3PXP',
            description: 'TOTP secret key for generating codes'
          },
          uri: { 
            type: 'string', 
            example: 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
            description: 'URI for QR code generation'
          }
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 422, description: 'User not found or 2FA already enabled' })
  )
}

export const AuthSwagger = {
  tags: 'Auth',
  login: {
    operation: ApiOperation({ summary: 'Login user' }),
    responses: [
      ApiResponse({ status: 200, description: 'Login successful', schema: LoginResponseSchema }),
      ApiResponse({ status: 401, description: 'Invalid credentials' })
    ]
  },
  register: {
    operation: ApiOperation({ summary: 'Register new user' }),
    responses: [
      ApiResponse({ status: 201, description: 'User registered successfully', schema: UserResponseSchema }),
      ApiResponse({ status: 409, description: 'Email already exists' })
    ]
  },
  verifyEmail: {
    operation: ApiOperation({ summary: 'Verify user email' }),
    responses: [
      ApiResponse({ status: 200, description: 'Email verified successfully' }),
      ApiResponse({ status: 400, description: 'Invalid verification code' })
    ]
  },
  forgotPassword: {
    operation: ApiOperation({ summary: 'Request password reset' }),
    responses: [
      ApiResponse({ status: 200, description: 'Password reset email sent' }),
      ApiResponse({ status: 404, description: 'User not found' })
    ]
  },
  resetPassword: {
    operation: ApiOperation({ summary: 'Reset password' }),
    responses: [
      ApiResponse({ status: 200, description: 'Password reset successful' }),
      ApiResponse({ status: 400, description: 'Invalid reset code' })
    ]
  },
  refreshToken: {
    operation: ApiOperation({ summary: 'Refresh access token' }),
    responses: [
      ApiResponse({ status: 200, description: 'Token refreshed successfully' }),
      ApiResponse({ status: 401, description: 'Invalid refresh token' })
    ]
  },
  logout: {
    operation: ApiOperation({ summary: 'Logout user' }),
    responses: [
      ApiResponse({ status: 200, description: 'Logout successful' })
    ]
  },
  getProfile: {
    operation: ApiOperation({ summary: 'Get user profile' }),
    responses: [
      ApiResponse({ status: 200, description: 'Return user profile', schema: UserResponseSchema }),
      ApiResponse({ status: 401, description: 'Unauthorized' })
    ]
  },
  updateProfile: {
    operation: ApiOperation({ summary: 'Update user profile' }),
    responses: [
      ApiResponse({ status: 200, description: 'Profile updated successfully', schema: UserResponseSchema }),
      ApiResponse({ status: 401, description: 'Unauthorized' })
    ]
  },
  changePassword: {
    operation: ApiOperation({ summary: 'Change user password' }),
    responses: [
      ApiResponse({ status: 200, description: 'Password changed successfully' }),
      ApiResponse({ status: 401, description: 'Invalid current password' })
    ]
  }
} 