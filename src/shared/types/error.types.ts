import { z } from 'zod'

// Prisma Error Codes
export const PRISMA_ERROR_CODES = {
  UNIQUE_CONSTRAINT_VIOLATION: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
  FOREIGN_KEY_CONSTRAINT_VIOLATION: 'P2003',
  INVALID_ID: 'P2014',
  REQUIRED_FIELD_MISSING: 'P2012',
  VALUE_TOO_LONG: 'P2000',
  VALUE_OUT_OF_RANGE: 'P2020',
} as const

// Prisma Error Schema
export const PrismaErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  meta: z
    .object({
      target: z.array(z.string()).optional(),
      field_name: z.string().optional(),
      column_name: z.string().optional(),
      constraint: z.string().optional(),
    })
    .optional(),
})

// Custom Error Schemas
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  value: z.unknown().optional(),
  code: z.string().optional(),
})

export const BusinessLogicErrorSchema = z.object({
  type: z.enum(['CONFLICT', 'NOT_FOUND', 'FORBIDDEN', 'INVALID_OPERATION']),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
})

// Service Error Response Schema
export const ServiceErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    type: z.string(),
    message: z.string(),
    code: z.string().optional(),
    field: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }),
  timestamp: z.date().default(() => new Date()),
})

// Success Response Schema
export const ServiceSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  meta: z
    .object({
      timestamp: z.date().default(() => new Date()),
      requestId: z.string().optional(),
    })
    .optional(),
})

// API Response Schemas
export const ApiResponseSchema = z.union([ServiceSuccessResponseSchema, ServiceErrorResponseSchema])

// Pagination Meta Schema
export const PaginationMetaSchema = z.object({
  total: z.number().min(0),
  page: z.number().min(1),
  limit: z.number().min(1),
  totalPages: z.number().min(0),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
})

// Paginated Response Schema
export const PaginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  meta: PaginationMetaSchema,
})

// Types inferred from schemas
export type PrismaError = z.infer<typeof PrismaErrorSchema>
export type ValidationErrorType = z.infer<typeof ValidationErrorSchema>
export type BusinessLogicError = z.infer<typeof BusinessLogicErrorSchema>
export type ServiceErrorResponse = z.infer<typeof ServiceErrorResponseSchema>
export type ServiceSuccessResponse = z.infer<typeof ServiceSuccessResponseSchema>
export type ApiResponse = z.infer<typeof ApiResponseSchema>
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>
export type PaginatedResponse<T = unknown> = {
  data: T[]
  meta: PaginationMeta
}

// Error Handler Types
export interface ErrorContext {
  operation: string
  model: string
  data?: Record<string, unknown>
  userId?: number
}

export interface ErrorHandlerOptions {
  includeStackTrace?: boolean
  logLevel?: 'error' | 'warn' | 'info'
  notifyAdmin?: boolean
}

// Custom Error Classes (for TypeScript)
export class RepositoryError extends Error {
  constructor(
    public code: string,
    message: string,
    public meta?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export class ValidationError extends RepositoryError {
  constructor(
    public field: string,
    message: string,
    public value?: unknown,
  ) {
    super('VALIDATION_ERROR', message, { field, value })
    this.name = 'ValidationError'
  }
}

export class ConflictError extends RepositoryError {
  constructor(
    message: string,
    public conflictingFields: string[],
  ) {
    super('CONFLICT_ERROR', message, { conflictingFields })
    this.name = 'ConflictError'
  }
}

export class NotFoundError extends RepositoryError {
  constructor(
    public resource: string,
    public identifier: unknown,
  ) {
    super('NOT_FOUND_ERROR', `${resource} not found`, { resource, identifier })
    this.name = 'NotFoundError'
  }
}
