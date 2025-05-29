import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface Response<T> {
  data: T | null
  statusCode: number
  message?: string
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in the correct format with statusCode and message
        // and it's an error response (statusCode >= 400)
        if (data && typeof data === 'object' && 'statusCode' in data && 'message' in data && data.statusCode >= 400) {
          return data
        }

        // For successful responses
        return {
          data,
          statusCode: 200,
          message: 'Success'
        } as Response<T>
      }),
    )
  }
}
