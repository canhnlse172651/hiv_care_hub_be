import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

@Injectable()
export class SharedErrorHandlingService {
  /**
   * Handle common Prisma errors with consistent error messages
   */
  handlePrismaError(error: any, entityName: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          const target = error.meta?.target && Array.isArray(error.meta.target) ? error.meta.target.join(', ') : 'field'
          throw new ConflictException(`${entityName} with this ${target} already exists`)
        }
        case 'P2025':
          throw new NotFoundException(`${entityName} not found`)
        case 'P2003':
          throw new BadRequestException(`Invalid foreign key reference in ${entityName}`)
        case 'P2014': {
          const relationName = typeof error.meta?.relation_name === 'string' ? error.meta.relation_name : 'relation'
          throw new BadRequestException(
            `The change you are trying to make would violate the required relation '${relationName}' between the ${entityName} models`,
          )
        }
        default:
          throw new BadRequestException(`Database error: ${error.message}`)
      }
    }
    throw error
  }

  /**
   * Check if entity exists and throw NotFoundException if not
   */
  validateEntityExists<T>(entity: T | null, entityName: string, id: number): T {
    if (!entity) {
      throw new NotFoundException(`${entityName} with ID ${id} not found`)
    }
    return entity
  }

  /**
   * Validate name uniqueness before creation/update
   */
  validateNameUniqueness<T extends { id?: number; name: string }>(
    existingEntity: T | null,
    newName: string,
    entityName: string,
    currentId?: number,
  ): void {
    if (existingEntity && existingEntity.id !== currentId) {
      throw new ConflictException(`${entityName} with name "${newName}" already exists`)
    }
  }

  /**
   * Common pagination validation
   */
  validatePaginationParams(page: number, limit: number): { skip: number; take: number } {
    if (page < 1) {
      throw new BadRequestException('Page must be greater than 0')
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100')
    }

    return {
      skip: (page - 1) * limit,
      take: limit,
    }
  }

  /**
   * Validate date range
   */
  validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date')
    }

    const now = new Date()
    if (startDate > now) {
      throw new BadRequestException('Start date cannot be in the future')
    }
  }

  /**
   * Common ID validation
   */
  validateId(id: number | string, fieldName = 'ID'): number {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id

    if (isNaN(numericId) || numericId <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive number`)
    }

    return numericId
  }
}
