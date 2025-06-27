import { Body, Controller, HttpCode, HttpStatus, Post, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { ApiRegister, ApiLogin, ApiRefreshToken, ApiLogout } from '../../swagger/auth.swagger'
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto, SentOtpDto } from './auth.dto'
import { GoogleService } from './google.service'
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly googleService: GoogleService) {}

  @Post('register')
  @ApiRegister()
  async register(@Body() body: unknown) {
    const validatedData = RegisterDto.create(body);
    return await this.authService.register(validatedData);
  }

  
  @Post('sent-otp')
  // @ApiSentOtp()
  async sentOtp(@Body() body: unknown) {
    const validatedData = SentOtpDto.create(body);
    return this.authService.sentOtp(validatedData);
  }

  @Post('login')
  @ApiLogin()
  async login(@Body() body: unknown) {
    const validatedData = LoginDto.create(body);
    return this.authService.login(validatedData);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiRefreshToken()
  async refreshToken(@Body() body: unknown) {
    const validatedData = RefreshTokenDto.create(body);
    return this.authService.refreshToken(validatedData.refreshToken);
  }

  @Post('logout')
  @ApiLogout()
  async logout(@Body() body: unknown) {
    const validatedData = LogoutDto.create(body);
    return this.authService.logout(validatedData.refreshToken);
  }

  @Get('google-link')
  async googleLink() {
    return this.googleService.getAuthorizationUrl();
  }

  @Get('google/callback')
  async googleCallback(@Query() query: any) {
    return this.googleService.googleCallback(query);
  }
}