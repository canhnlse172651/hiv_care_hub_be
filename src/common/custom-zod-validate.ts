import { UnprocessableEntityException } from '@nestjs/common'
import { createZodValidationPipe } from 'nestjs-zod'
import { ZodError } from 'zod'

const CustomZodValidationPipe = createZodValidationPipe({
  // provide custom validation exception factory
  createValidationException: (error: ZodError) => {
    const formattedErrors = error.errors.map((err) => ({
      code: err.code,
      message: err.message,
      path: err.path.join('.')
    }))

    return new UnprocessableEntityException({
      statusCode: 422,
      message: {
        message: formattedErrors,
        error: 'Unprocessable Entity',
        statusCode: 422
      }
    })
  }
})

export default CustomZodValidationPipe