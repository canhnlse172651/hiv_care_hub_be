import { BadRequestException, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common'

export class PatientTreatmentErrorHandler {
  /**
   * Handle Prisma database errors and convert them to appropriate HTTP exceptions
   */
  static handleDatabaseError(error: any): never {
    // Prisma error codes
    if (error.code) {
      switch (error.code) {
        case 'P2002': {
          // Unique constraint violation
          const target = error.meta?.target || 'field'
          throw new ConflictException(`Duplicate value for ${target}. Record already exists.`)
        }

        case 'P2003': {
          // Foreign key constraint violation
          const field = error.meta?.field_name || 'reference'
          throw new BadRequestException(`Invalid ${field} - referenced record does not exist`)
        }

        case 'P2025':
          // Record not found
          throw new NotFoundException('Referenced record not found')

        case 'P2014':
          // Required relation violation
          throw new BadRequestException('Required relation is missing')

        case 'P2011': {
          // Null constraint violation
          const nullField = error.meta?.field_name || 'required field'
          throw new BadRequestException(`${nullField} cannot be null`)
        }

        case 'P2012':
          // Missing required value
          throw new BadRequestException('Missing required value')

        case 'P2013':
          // Missing required argument
          throw new BadRequestException('Missing required argument for database operation')

        case 'P2016':
          // Query interpretation error
          throw new BadRequestException('Invalid query parameters')

        case 'P2017':
          // Records not connected
          throw new BadRequestException('Related records are not properly connected')

        case 'P2018':
          // Required connected records not found
          throw new BadRequestException('Required connected records not found')

        case 'P2021':
          // Table does not exist
          throw new InternalServerErrorException('Database schema error')

        case 'P2022':
          // Column does not exist
          throw new InternalServerErrorException('Database column error')

        default:
          console.error('Unhandled Prisma error:', error)
          throw new InternalServerErrorException('Database operation failed')
      }
    }

    // Handle other database-related errors
    if (error.message) {
      if (error.message.includes('Foreign key constraint')) {
        throw new BadRequestException('Invalid reference - one or more referenced records do not exist')
      }

      if (error.message.includes('Unique constraint')) {
        throw new ConflictException('Record with these details already exists')
      }

      if (error.message.includes('Check constraint')) {
        throw new BadRequestException('Data violates database constraints')
      }

      if (error.message.includes('Not null constraint')) {
        throw new BadRequestException('Required field cannot be empty')
      }
    }

    // Default fallback
    console.error('Unknown database error:', error)
    throw new InternalServerErrorException('An unexpected database error occurred')
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error: any): never {
    if (error.name === 'ZodError') {
      const errorMessages =
        error.errors?.map((err: any) => `${err.path?.join('.')}: ${err.message}`).join(', ') || 'Validation failed'

      throw new BadRequestException(`Validation error: ${errorMessages}`)
    }

    if (error.message?.includes('validation')) {
      throw new BadRequestException(`Validation error: ${error.message}`)
    }

    throw new BadRequestException('Data validation failed')
  }

  /**
   * Handle business logic errors
   */
  static handleBusinessLogicError(error: any): never {
    const message = error.message || 'Business rule violation'

    if (message.includes('already exists') || message.includes('duplicate')) {
      throw new ConflictException(message)
    }

    if (message.includes('not found') || message.includes('does not exist')) {
      throw new NotFoundException(message)
    }

    if (message.includes('invalid') || message.includes('required')) {
      throw new BadRequestException(message)
    }

    throw new BadRequestException(message)
  }

  /**
   * Main error handler that determines the type of error and handles accordingly
   */
  static handleError(error: any, context: string = 'Operation'): never {
    console.error(`${context} error:`, error)

    // Handle known HTTP exceptions (pass through)
    if (error.status && error.response) {
      throw error
    }

    // Handle Prisma/Database errors
    if (error.code && error.code.startsWith('P')) {
      this.handleDatabaseError(error)
    }

    // Handle validation errors
    if (error.name === 'ZodError' || error.message?.includes('validation')) {
      this.handleValidationError(error)
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      throw new BadRequestException('Invalid JSON format in request data')
    }

    // Handle type conversion errors
    if (error.message?.includes('invalid type') || error.message?.includes('NaN')) {
      throw new BadRequestException('Invalid data type in request')
    }

    // Handle timeout errors
    if (error.message?.includes('timeout')) {
      throw new InternalServerErrorException('Operation timed out')
    }

    // Handle connection errors
    if (error.message?.includes('connection') || error.message?.includes('ECONNREFUSED')) {
      throw new InternalServerErrorException('Database connection error')
    }

    // Default fallback for unknown errors
    throw new InternalServerErrorException(`${context} failed: ${error.message || 'Unknown error'}`)
  }
}
