import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'

// Register schemas
export const RegisterBodySchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    name: { type: 'string', minLength: 1 },
    phoneNumber: { type: 'string', minLength: 9 },
    confirmPassword: { type: 'string', minLength: 6 }
  },
  required: ['email', 'password', 'name', 'phoneNumber', 'confirmPassword']
}

export const RegisterResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    email: { type: 'string' },
    name: { type: 'string' },
    phoneNumber: { type: 'string' },
    roleId: { type: 'number' },
    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
}

// Login schemas
export const LoginBodySchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 }
  },
  required: ['email', 'password']
}

export const LoginResponseSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' }
  }
}

// Token schemas
export const TokenBodySchema = {
  type: 'object',
  properties: {
    refreshToken: { type: 'string' }
  },
  required: ['refreshToken']
}

export const LogoutResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Logout successfully' }
  }
}

// Decorators
export const ApiRegister = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new user' }),
    ApiBody({ schema: RegisterBodySchema }),
    ApiResponse({ 
      status: 201, 
      description: 'User successfully registered',
      schema: RegisterResponseSchema
    }),
    ApiResponse({ status: 409, description: 'Email already exists' })
  )
}

export const ApiLogin = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Login user' }),
    ApiBody({ schema: LoginBodySchema }),
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
    ApiBody({ schema: TokenBodySchema }),
    ApiResponse({ 
      status: 200, 
      description: 'Tokens successfully refreshed',
      schema: LoginResponseSchema
    }),
    ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  )
}

export const ApiLogout = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Logout user' }),
    ApiBody({ schema: TokenBodySchema }),
    ApiResponse({ 
      status: 200, 
      description: 'User successfully logged out',
      schema: LogoutResponseSchema
    }),
    ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  )
} 