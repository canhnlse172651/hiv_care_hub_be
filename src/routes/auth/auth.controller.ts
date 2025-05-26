import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginBodyType, RegisterBodyType } from './auth.model'
import { ApiRegister, ApiLogin, ApiRefreshToken, ApiLogout } from './auth.swagger'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiRegister()
  async register(@Body() body: RegisterBodyType) {
    return await this.authService.register(body)
  }

  @Post('login')
  @ApiLogin()
  async login(@Body() body: LoginBodyType) {
    return this.authService.login(body)
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiRefreshToken()
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken)
  }

  @Post('logout')
  @ApiLogout()
  async logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken)
  }
}