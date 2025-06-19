// Shared constants for consistent API responses and endpoint patterns
export const API_PATTERNS = {
  SEARCH: 'search',
  ADVANCED_SEARCH: 'advanced-search',
  BULK: 'bulk',
  STATS: 'stats',
  ANALYTICS: 'analytics',
} as const

export const ENTITY_NAMES = {
  MEDICINE: 'Medicine',
  PATIENT_TREATMENT: 'Patient Treatment',
  TREATMENT_PROTOCOL: 'Treatment Protocol',
} as const

export const RESPONSE_MESSAGES = {
  CREATED: (entity: string) => `${entity} created successfully`,
  UPDATED: (entity: string) => `${entity} updated successfully`,
  DELETED: (entity: string) => `${entity} deleted successfully`,
  NOT_FOUND: (entity: string) => `${entity} not found`,
  ALREADY_EXISTS: (entity: string, field: string) => `${entity} with this ${field} already exists`,
  BULK_CREATED: (entity: string, count: number) => `${count} ${entity.toLowerCase()}(s) created successfully`,
} as const

export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  POSITIVE: (field: string) => `${field} must be positive`,
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must be at most ${max} characters`,
  INVALID_DATE: (field: string) => `${field} must be a valid date`,
  DATE_RANGE: 'Start date must be before end date',
} as const

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  SORT_ORDER: 'desc' as const,
} as const

// Common HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const
