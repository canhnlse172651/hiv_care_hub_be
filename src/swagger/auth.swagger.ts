import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody} from '@nestjs/swagger'
import { LoginBodySchema, RefreshTokenSchema, LogoutSchema } from '../routes/auth/auth.model'
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