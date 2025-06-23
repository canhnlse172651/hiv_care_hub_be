import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { PrismaService } from '../shared/services/prisma.service'
import {
  ConflictError,
  NotFoundError,
  PRISMA_ERROR_CODES,
  PrismaErrorSchema,
  RepositoryError,
  ValidationError,
} from '../shared/types/error.types'

export interface BaseRepositoryOptions {
  include?: Record<string, unknown>
  select?: Record<string, boolean>
}

export interface PrismaModel<T, CreateInput, UpdateInput, WhereInput, WhereUniqueInput, OrderByInput> {
  create: (args: {
    data: CreateInput
    include?: Record<string, unknown>
    select?: Record<string, boolean>
  }) => Promise<T>
  findFirst: (args: {
    where: WhereInput
    include?: Record<string, unknown>
    select?: Record<string, boolean>
  }) => Promise<T | null>
  findUnique: (args: {
    where: WhereUniqueInput
    include?: Record<string, unknown>
    select?: Record<string, boolean>
  }) => Promise<T | null>
  findMany: (args: {
    where?: WhereInput
    skip?: number
    take?: number
    orderBy?: OrderByInput
    include?: Record<string, unknown>
    select?: Record<string, boolean>
  }) => Promise<T[]>
  update: (args: {
    where: WhereUniqueInput
    data: UpdateInput
    include?: Record<string, unknown>
    select?: Record<string, boolean>
  }) => Promise<T>
  delete: (args: { where: WhereUniqueInput }) => Promise<T>
  count: (args?: { where?: WhereInput }) => Promise<number>
  createMany: (args: { data: CreateInput[]; skipDuplicates?: boolean }) => Promise<{ count: number }>
  updateMany: (args: { where: WhereInput; data: UpdateInput }) => Promise<{ count: number }>
  deleteMany: (args: { where: WhereInput }) => Promise<{ count: number }>
  upsert: (args: {
    where: WhereUniqueInput
    create: CreateInput
    update: UpdateInput
    include?: Record<string, unknown>
    select?: Record<string, boolean>
  }) => Promise<T>
}

// Base schemas for validation
export const BaseQueryParamsSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
})

export const IdParamSchema = z.object({
  id: z.number().positive('ID must be a positive number'),
})

export const SoftDeleteSchema = z.object({
  deletedAt: z.date().nullable(),
})

export type BaseQueryParams = z.infer<typeof BaseQueryParamsSchema>
export type IdParam = z.infer<typeof IdParamSchema>

@Injectable()
export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereInput,
  WhereUniqueInput,
  OrderByInput,
  IncludeInput,
> {
  constructor(protected readonly prismaService: PrismaService) {}

  // Abstract method to get the Prisma model - must be implemented by child classes
  abstract getModel(): PrismaModel<T, CreateInput, UpdateInput, WhereInput, WhereUniqueInput, OrderByInput>

  /**
   * Validates and converts ID parameter to number
   * Supports both number and string input for flexibility
   *
   * @param id - ID to validate (number or string)
   * @returns Validated number ID
   * @throws ZodError if ID is invalid
   */
  protected validateId(id: number | string): number {
    const result = z.union([z.number().positive(), z.string().transform(Number)]).parse(id)
    return typeof result === 'string' ? parseInt(result, 10) : result
  }

  // Get model for pagination (used by PaginationService)
  getModelForPagination(): PrismaModel<T, CreateInput, UpdateInput, WhereInput, WhereUniqueInput, OrderByInput> {
    return this.getModel()
  }

  // Validation methods using Zod
  protected validateQueryParams(params: unknown): BaseQueryParams {
    return BaseQueryParamsSchema.parse(params)
  }

  protected validatePaginationParams(page?: number, limit?: number) {
    const validated = BaseQueryParamsSchema.parse({
      page: page || 1,
      limit: limit || 10,
    })
    return {
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    }
  }

  // Create a new record with validation
  async create(data: CreateInput, options?: BaseRepositoryOptions): Promise<T> {
    try {
      return await this.getModel().create({
        data,
        ...options,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Find record by ID with validation
  async findById(id: number | string, options?: BaseRepositoryOptions): Promise<T | null> {
    const validatedId = this.validateId(id)
    try {
      return await this.getModel().findUnique({
        where: { id: validatedId } as WhereUniqueInput,
        ...options,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Find first record matching the condition
  async findFirst(where: WhereInput, options?: BaseRepositoryOptions): Promise<T | null> {
    try {
      return await this.getModel().findFirst({
        where,
        ...options,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Find many records
  async findMany(params: {
    skip?: number
    take?: number
    where?: WhereInput
    orderBy?: OrderByInput
    include?: Record<string, unknown>
    select?: Record<string, boolean>
  }): Promise<T[]> {
    const { skip, take, where, orderBy, include, select } = params
    try {
      return await this.getModel().findMany({
        skip,
        take,
        where,
        orderBy,
        include,
        select,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Update record
  async update(where: WhereUniqueInput, data: UpdateInput, options?: BaseRepositoryOptions): Promise<T> {
    try {
      return await this.getModel().update({
        where,
        data,
        ...options,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Update by ID
  async updateById(id: number | string, data: UpdateInput, options?: BaseRepositoryOptions): Promise<T> {
    const validatedId = this.validateId(id)
    try {
      return await this.getModel().update({
        where: { id: validatedId } as WhereUniqueInput,
        data,
        ...options,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Delete record
  async delete(where: WhereUniqueInput): Promise<T> {
    try {
      return await this.getModel().delete({
        where,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Delete by ID
  async deleteById(id: number | string): Promise<T> {
    const validatedId = this.validateId(id)
    try {
      return await this.getModel().delete({
        where: { id: validatedId } as WhereUniqueInput,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Count records
  async count(where?: WhereInput): Promise<number> {
    try {
      return await this.getModel().count({
        where,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Check if record exists
  async exists(where: WhereInput): Promise<boolean> {
    const count = await this.count(where)
    return count > 0
  }

  // Upsert record
  async upsert(
    where: WhereUniqueInput,
    create: CreateInput,
    update: UpdateInput,
    options?: BaseRepositoryOptions,
  ): Promise<T> {
    try {
      return await this.getModel().upsert({
        where,
        create,
        update,
        ...options,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Soft delete (if deletedAt field exists) - with validation
  async softDelete(id: number | string): Promise<T> {
    const validatedId = this.validateId(id)
    const deleteData = {
      deletedAt: new Date(),
    } as UpdateInput
    return this.updateById(validatedId, deleteData)
  }

  // Restore soft deleted record - with validation
  async restore(id: number | string): Promise<T> {
    const validatedId = this.validateId(id)
    const restoreData = {
      deletedAt: null,
    } as UpdateInput
    return this.updateById(validatedId, restoreData)
  }

  // Find records excluding soft deleted
  async findManyActive(params: {
    skip?: number
    take?: number
    where?: WhereInput
    orderBy?: OrderByInput
    include?: Record<string, unknown>
    select?: Record<string, boolean>
  }): Promise<T[]> {
    const { where, ...rest } = params
    const activeWhere = {
      ...where,
      deletedAt: null,
    } as WhereInput

    return this.findMany({
      ...rest,
      where: activeWhere,
    })
  }

  // Count active records
  async countActive(where?: WhereInput): Promise<number> {
    const activeWhere = {
      ...where,
      deletedAt: null,
    } as WhereInput
    return this.count(activeWhere)
  }

  // Generic search method
  async search(
    searchFields: string[],
    searchTerm: string,
    params?: {
      skip?: number
      take?: number
      where?: WhereInput
      orderBy?: OrderByInput
      include?: Record<string, unknown>
      select?: Record<string, boolean>
    },
  ): Promise<T[]> {
    const searchConditions = searchFields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    }))

    const searchWhere = {
      OR: searchConditions,
      ...params?.where,
    } as WhereInput

    return this.findMany({
      ...params,
      where: searchWhere,
    })
  }

  // Batch operations
  async createMany(data: CreateInput[], skipDuplicates?: boolean): Promise<{ count: number }> {
    try {
      return await this.getModel().createMany({
        data,
        skipDuplicates,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  async updateMany(where: WhereInput, data: UpdateInput): Promise<{ count: number }> {
    try {
      return await this.getModel().updateMany({
        where,
        data,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  async deleteMany(where: WhereInput): Promise<{ count: number }> {
    try {
      return await this.getModel().deleteMany({
        where,
      })
    } catch (error) {
      throw this.handlePrismaError(error)
    }
  }

  // Enhanced error handling method for Prisma errors
  protected handlePrismaError(error: unknown): Error {
    // Validate error structure using Zod
    const validationResult = PrismaErrorSchema.safeParse(error)

    if (!validationResult.success) {
      // If it's not a Prisma error, return the original error or create a generic one
      if (error instanceof Error) {
        return error
      }
      return new RepositoryError('UNKNOWN_ERROR', 'An unknown error occurred', { originalError: error })
    }

    const prismaError = validationResult.data

    switch (prismaError.code) {
      case PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION: {
        const target = prismaError.meta?.target?.join(', ') || 'unknown field'
        return new ConflictError(`Unique constraint violation on field(s): ${target}`, prismaError.meta?.target || [])
      }

      case PRISMA_ERROR_CODES.RECORD_NOT_FOUND: {
        return new NotFoundError('Record', 'unknown')
      }

      case PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION: {
        return new ConflictError(
          'Foreign key constraint violation',
          prismaError.meta?.field_name ? [prismaError.meta.field_name] : [],
        )
      }

      case PRISMA_ERROR_CODES.INVALID_ID: {
        return new ValidationError('id', 'Invalid ID provided')
      }

      case PRISMA_ERROR_CODES.REQUIRED_FIELD_MISSING: {
        const field = prismaError.meta?.field_name || 'unknown'
        return new ValidationError(field, `Required field '${field}' is missing`)
      }

      case PRISMA_ERROR_CODES.VALUE_TOO_LONG: {
        return new ValidationError(prismaError.meta?.column_name || 'unknown', 'Value is too long for the field')
      }

      case PRISMA_ERROR_CODES.VALUE_OUT_OF_RANGE: {
        return new ValidationError(prismaError.meta?.column_name || 'unknown', 'Value is out of range for the field')
      }

      default: {
        return new RepositoryError('PRISMA_ERROR', prismaError.message, {
          code: prismaError.code,
          meta: prismaError.meta,
        })
      }
    }
  }
}
