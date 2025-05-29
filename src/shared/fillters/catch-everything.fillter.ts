import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { ZodError } from 'zod'

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost
    const ctx = host.switchToHttp()

    // Handle Zod validation errors
    if (exception instanceof ZodError) {
      const responseBody = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: {
          errors: exception.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        }
      }
      httpAdapter.reply(ctx.getResponse(), responseBody, HttpStatus.BAD_REQUEST)
      return
    }

    // Handle other errors
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | object = 'Internal Server Error'

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus()
      message = exception.getResponse() as string
    } else if (isUniqueConstraintPrismaError(exception)) {
      httpStatus = HttpStatus.CONFLICT
      message = 'Record already exists'
    }

    const responseBody = {
      statusCode: httpStatus,
      message,
    }
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus)
  }
}