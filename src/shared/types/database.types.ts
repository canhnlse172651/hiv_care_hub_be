// Database Model Types (Generic)
export interface DatabaseModel {
  id: number
  createdAt: Date
  updatedAt: Date
}

export interface SoftDeletableModel extends DatabaseModel {
  deletedAt?: Date | null
}

export interface UserAuditableModel extends DatabaseModel {
  createdById?: number | null
  updatedById?: number | null
}

// Generic CRUD Operation Types
export interface CreateInput<T = Record<string, unknown>> {
  data: T
}

export interface UpdateInput<T = Record<string, unknown>> {
  data: Partial<T>
}

export type WhereInput<T = Record<string, unknown>> = {
  [K in keyof T]?:
    | T[K]
    | {
        equals?: T[K]
        not?: T[K]
        in?: T[K][]
        notIn?: T[K][]
        contains?: T[K]
        startsWith?: T[K]
        endsWith?: T[K]
        mode?: 'default' | 'insensitive'
        gt?: T[K]
        gte?: T[K]
        lt?: T[K]
        lte?: T[K]
      }
}

export interface WhereUniqueInput {
  id?: number
  [key: string]: unknown
}

export interface OrderByInput {
  [key: string]: 'asc' | 'desc'
}

export interface IncludeInput {
  [key: string]: boolean | IncludeInput
}

export interface SelectInput {
  [key: string]: boolean
}

// Find Many Parameters
export interface FindManyParams<T = Record<string, unknown>> {
  skip?: number
  take?: number
  where?: WhereInput<T>
  orderBy?: OrderByInput
  include?: IncludeInput
  select?: SelectInput
}

// Repository Method Return Types
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BatchCreateResult {
  count: number
  created: number[]
}

export interface BatchUpdateResult {
  count: number
  updated: number[]
}

export interface BatchDeleteResult {
  count: number
  deleted: number[]
}

// Repository Options
export interface RepositoryFindOptions {
  include?: IncludeInput
  select?: SelectInput
}

export interface RepositoryCreateOptions extends RepositoryFindOptions {
  skipDuplicates?: boolean
}

export interface RepositoryUpdateOptions extends RepositoryFindOptions {
  upsert?: boolean
}

// Search and Filter Types
export interface SearchFilter {
  fields: string[]
  query: string
  caseSensitive?: boolean
}

export interface RangeFilter<T = number | Date> {
  min?: T
  max?: T
}

export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

// Error Types
export interface RepositoryError {
  code: string
  message: string
  field?: string
  value?: unknown
}

export interface ValidationError extends RepositoryError {
  constraints: Record<string, string>
}

export interface ConflictError extends RepositoryError {
  conflictingFields: string[]
}

export interface NotFoundError extends RepositoryError {
  resource: string
  identifier: unknown
}

// Audit Types
export interface AuditLog {
  id: number
  entityName: string
  entityId: number
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  userId?: number
  timestamp: Date
}

// Transaction Types
export interface TransactionContext {
  id: string
  startTime: Date
  operations: TransactionOperation[]
}

export interface TransactionOperation {
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  model: string
  data: Record<string, unknown>
  where?: Record<string, unknown>
}
