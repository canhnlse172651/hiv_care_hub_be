export interface TestFilter {
  category?: string
  isQuantitative?: boolean
}

export interface TestResultFilter {
  userId?: number
  testId?: number
  appointmentId?: number
  interpretation?: string
  dateFrom?: string
  dateTo?: string
  doctorId?: number
  labTechId?: number
}

export interface WhereClause {
  [key: string]: any
}

export interface OrderByClause {
  [key: string]: 'asc' | 'desc'
}

export interface PaginationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface TestQuery extends PaginationQuery {
  filters?: TestFilter
}

export interface TestResultQueryInterface extends PaginationQuery {
  userId?: number
  testId?: number
  appointmentId?: number
  interpretation?: string
  dateFrom?: string
  dateTo?: string
  doctorId?: number
  labTechId?: number
}
