import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant'
import { TokenService } from 'src/shared/services/token.service'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    console.log('=== Request Headers ===')
    console.log('Authorization:', request.headers.authorization)
    console.log('All Headers:', request.headers)
    console.log('=====================')

    const accessToken = request.headers.authorization?.split(' ')[1]
    if (!accessToken) {
      console.log('No access token found in request')
      throw new UnauthorizedException('No access token provided')
    }
    try {
      const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decodedAccessToken
      console.log('=== User Information ===')
      console.log('request-user-key', request[REQUEST_USER_KEY])
      console.log('User ID:', decodedAccessToken.userId)
      console.log('Token:', accessToken)
      console.log('=====================')
      return true
    } catch (error) {
      console.log('Token verification failed:', error)
      throw new UnauthorizedException('Invalid access token')
    }
  }
}
