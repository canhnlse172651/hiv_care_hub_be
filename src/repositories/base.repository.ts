import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginationResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface BaseEntity {
  id: number
  createdAt?: Date
  updatedAt?: Date
  createdById?: number | null
  updatedById?: number | null
}

type PrismaModel = any

@Injectable()
export abstract class BaseRepository<T extends BaseEntity, CreateData, UpdateData> {
  protected abstract model: PrismaModel
  protected abstract searchFields: string[]

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Get the Prisma model for this repository
   */
  getModel(): PrismaModel {
    return this.model
  }

  /**
   * Create a new entity
   */
  async create(data: CreateData, userId?: number): Promise<T> {
    const createData = userId ? { ...(data as any), createdById: userId, updatedById: userId } : (data as any)

    return (await this.model.create({
      data: createData,
      include: this.getDefaultInclude(),
    })) as T
  }

  /**
   * Find entity by ID
   */
  async findById(id: number): Promise<T | null> {
    return (await this.model.findUnique({
      where: { id },
      include: this.getDefaultInclude(),
    })) as T | null
  }

  /**
   * Find entity by unique field
   */
  async findUnique(where: any): Promise<T | null> {
    return (await this.model.findUnique({
      where,
      include: this.getDefaultInclude(),
    })) as T | null
  }

  /**
   * Find first entity matching criteria
   */
  async findFirst(where: any): Promise<T | null> {
    return (await this.model.findFirst({
      where,
      include: this.getDefaultInclude(),
    })) as T | null
  }

  /**
   * Find many entities with optional filtering
   */
  async findMany(where?: any, orderBy?: any): Promise<T[]> {
    return (await this.model.findMany({
      where,
      orderBy,
      include: this.getDefaultInclude(),
    })) as T[]
  }

  /**
   * Update entity by ID
   */
  async update(id: number, data: UpdateData, userId?: number): Promise<T> {
    const updateData = userId ? { ...(data as any), updatedById: userId } : (data as any)

    return (await this.model.update({
      where: { id },
      data: updateData,
      include: this.getDefaultInclude(),
    })) as T
  }

  /**
   * Delete entity by ID (soft delete if supported)
   */
  async delete(id: number): Promise<T> {
    // Check if model has deletedAt field for soft delete
    const modelFields = await this.getModelFields()
    if (modelFields.includes('deletedAt')) {
      return (await this.model.update({
        where: { id },
        data: { deletedAt: new Date() },
        include: this.getDefaultInclude(),
      })) as T
    } else {
      return (await this.model.delete({
        where: { id },
        include: this.getDefaultInclude(),
      })) as T
    }
  }

  /**
   * Hard delete entity by ID
   */
  async hardDelete(id: number): Promise<T> {
    return (await this.model.delete({
      where: { id },
      include: this.getDefaultInclude(),
    })) as T
  }

  /**
   * Count entities matching criteria
   */
  async count(where?: any): Promise<number> {
    return (await this.model.count({ where })) as number
  }

  /**
   * Check if entity exists
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.model.count({ where })
    return count > 0
  }

  /**
   * Paginated find with search functionality
   */
  async findWithPagination(options: PaginationOptions = {}, additionalWhere?: any): Promise<PaginationResult<T>> {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'desc', search } = options

    const skip = (page - 1) * limit

    // Build base where clause
    let where: any = { ...additionalWhere }

    // Add soft delete filter if model supports it
    const modelFields = await this.getModelFields()
    if (modelFields.includes('deletedAt')) {
      where.deletedAt = null
    }

    // Add search functionality if search term is provided
    if (search && this.searchFields.length > 0) {
      const searchConditions = this.searchFields.map((field) => ({
        [field]: {
          contains: search,
          mode: 'insensitive',
        },
      }))

      // Check if we have other conditions besides deletedAt
      const whereKeys = Object.keys(where as Record<string, any>)
      const hasOtherConditions = whereKeys.some((key) => key !== 'deletedAt')

      if (hasOtherConditions) {
        // We have other conditions, combine them properly with AND
        where = {
          AND: [
            where,
            {
              OR: searchConditions,
            },
          ],
        }
      } else {
        // Only deletedAt filter (or no filters), can safely add OR conditions
        where = {
          ...where,
          OR: searchConditions,
        }
      }
    }

    // Build order by
    const orderBy = { [sortBy]: sortOrder }

    // Execute queries
    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.getDefaultInclude(),
      }) as Promise<T[]>,
      this.model.count({ where }) as Promise<number>,
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    }
  }

  /**
   * Bulk create entities
   */
  async createMany(data: CreateData[], userId?: number): Promise<{ count: number }> {
    const createData = userId ? data.map((item) => ({ ...item, createdById: userId, updatedById: userId })) : data

    return (await this.model.createMany({
      data: createData,
      skipDuplicates: true,
    })) as { count: number }
  }

  /**
   * Bulk update entities
   */
  async updateMany(where: any, data: Partial<UpdateData>, userId?: number): Promise<{ count: number }> {
    const updateData = userId ? { ...(data as any), updatedById: userId } : (data as any)

    return (await this.model.updateMany({
      where,
      data: updateData,
    })) as { count: number }
  }

  /**
   * Bulk delete entities
   */
  async deleteMany(where: any): Promise<{ count: number }> {
    const modelFields = await this.getModelFields()
    if (modelFields.includes('deletedAt')) {
      return (await this.model.updateMany({
        where,
        data: { deletedAt: new Date() },
      })) as { count: number }
    } else {
      return (await this.model.deleteMany({ where })) as { count: number }
    }
  }

  /**
   * Execute raw query
   */
  async executeRaw(query: string, values: unknown[] = []): Promise<any> {
    if (values.length === 0) {
      return await this.prisma.$queryRawUnsafe(query)
    }
    return await this.prisma.$queryRawUnsafe(query, ...values)
  }

  /**
   * Start a transaction
   */
  async transaction<R>(fn: (tx: any) => Promise<R>): Promise<R> {
    return await this.prisma.$transaction(fn)
  }

  /**
   * Get default include relationships for this model
   * Override in child classes to customize relationships
   */
  protected getDefaultInclude(): any {
    return {}
  }

  private _cachedModelFields: string[] | null = null

  /**
   * Get model field names (for checking if soft delete is supported)
   */
  private async getModelFields(): Promise<string[]> {
    // Return cached fields if available
    if (this._cachedModelFields !== null) {
      return this._cachedModelFields
    }

    try {
      // This is a simplified approach - in a real implementation,
      // you might want to use Prisma's introspection capabilities
      const sampleRecord = await this.model.findFirst({})
      this._cachedModelFields = sampleRecord ? Object.keys(sampleRecord as Record<string, any>) : []
      return this._cachedModelFields
    } catch (error) {
      // If we can't get a sample record, use a fallback based on common fields
      console.warn('Unable to introspect model fields, using fallback approach:', error)
      this._cachedModelFields = ['id', 'createdAt', 'updatedAt'] // Basic fields that most models have
      return this._cachedModelFields
    }
  }

  /**
   * Build dynamic where clause for advanced filtering
   */
  protected buildWhereClause(filters: Record<string, any>): any {
    const where: any = {}

    Object.keys(filters).forEach((key) => {
      const value = filters[key]
      if (value !== undefined && value !== null && value !== '') {
        // Handle different filter types
        if (typeof value === 'string') {
          where[key] = {
            contains: value,
            mode: 'insensitive',
          }
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          where[key] = value
        } else if (Array.isArray(value)) {
          where[key] = {
            in: value,
          }
        } else if (typeof value === 'object') {
          where[key] = value
        }
      }
    })

    return where
  }

  /**
   * Restore soft deleted entity
   */
  async restore(id: number): Promise<T | null> {
    const modelFields = await this.getModelFields()
    if (modelFields.includes('deletedAt')) {
      return (await this.model.update({
        where: { id },
        data: { deletedAt: null },
        include: this.getDefaultInclude(),
      })) as T
    }
    return null
  }

  /**
   * Find with relations
   */
  async findWithRelations(id: number, include: any): Promise<T | null> {
    return (await this.model.findUnique({
      where: { id },
      include: {
        ...this.getDefaultInclude(),
        ...include,
      },
    })) as T | null
  }
}
