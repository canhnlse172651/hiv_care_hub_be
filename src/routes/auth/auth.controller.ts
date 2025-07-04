import { Body, Controller, HttpCode, HttpStatus, Post, Get, Query, UseGuards, Req, Patch } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import {
  ApiRegister,
  ApiLogin,
  ApiRefreshToken,
  ApiLogout,
  ApiSentOtp,
  ApiGoogleLink,
  ApiGoogleCallback,
  ApiForgotPassword,
  ApiSetup2FA,
  ApiDisable2FA,
  ApiUpdateProfile,
} from '../../swagger/auth.swagger'
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  LogoutDto,
  SentOtpDto,
  ForgotPasswordBodyDto,
  TwoFaResDto,
  Setup2FaDto,
  Disable2FaBodyDto,
  GetProfileDto,
  UpdateProfileDto,
} from './auth.dto'
import { GoogleService } from './google.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { TokenPayload } from 'src/shared/types/jwt.type'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post('register')
  @ApiRegister()
  async register(@Body() body: unknown) {
    const validatedData = RegisterDto.create(body)
    return await this.authService.register(validatedData)
  }

  @Post('login')
  @ApiLogin()
  async login(@Body() body: unknown) {
    const validatedData = LoginDto.create(body)
    return this.authService.login(validatedData)
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiRefreshToken()
  async refreshToken(@Body() body: unknown) {
    const validatedData = RefreshTokenDto.create(body)
    return this.authService.refreshToken(validatedData.refreshToken)
  }

  @Post('logout')
  @ApiLogout()
  async logout(@Body() body: unknown) {
    const validatedData = LogoutDto.create(body)
    return this.authService.logout(validatedData.refreshToken)
  }

  @Post('sent-otp')
  @ApiSentOtp()
  async sentOtp(@Body() body: unknown) {
    const validatedData = SentOtpDto.create(body)
    return this.authService.sentOtp(validatedData)
  }

  @Get('google-link')
  @ApiGoogleLink()
  async googleLink() {
    return this.googleService.getAuthorizationUrl()
  }

  @Get('google/callback')
  @ApiGoogleCallback()
  async googleCallback(@Query() query: any) {
    return this.googleService.googleCallback(query)
  }

  @Post('forgot-password')
  @ApiForgotPassword()
  async forgotPassword(@Body() body: unknown) {
    const validatedData = ForgotPasswordBodyDto.create(body)
    return this.authService.forgotPassword(validatedData)
  }
  @Auth([AuthType.Bearer])
  @ApiBearerAuth()
  @Post('setup-2fa')
  @ApiSetup2FA()
  async setup2FA(@Body() body: {}, @ActiveUser() user: TokenPayload) {
    console.log('user 2 fa', user)
    return this.authService.setupTwoFactorAuth(user.userId)
  }

  @Auth([AuthType.Bearer])
  @ApiBearerAuth()
  @Post('disable-2fa')
  @ApiDisable2FA()
  async disable2FA(@Body() body: unknown, @ActiveUser() user: TokenPayload) {
    const validatedData = Disable2FaBodyDto.create(body)
    console.log('user 2 fa', user)
    return this.authService.disableTwoFactorAuth({
      userId: user.userId,
      ...validatedData,
    })
  }

  @ApiBearerAuth()
  @Auth([AuthType.Bearer])
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@ActiveUser() user: TokenPayload) {
    return this.authService.getUserProfile(user.userId)
  }

  @ApiBearerAuth()
  @Auth([AuthType.Bearer])
  @Patch('update-profile')
  @ApiUpdateProfile()
  async updateProfile(@ActiveUser() user: TokenPayload, @Body() body: unknown) {
    const validatedData = UpdateProfileDto.create(body)
    return this.authService.updateUserProfile(user.userId, validatedData)
  }
}
