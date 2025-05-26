import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { AuthService } from 'src/routes/auth/auth.service'
import { RegisterDto, LoginDto } from './auth.dto'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    schema: {
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        name: { type: 'string' },
        phoneNumber: { type: 'string' },
        roleId: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() body: RegisterDto) {
    return await this.authService.register(body)
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 422, description: 'Password is incorrect' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body)
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      properties: {
        refreshToken: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tokens successfully refreshed',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken)
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({
    schema: {
      properties: {
        refreshToken: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged out',
    schema: {
      properties: {
        message: { type: 'string', example: 'Logout successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  async logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken)
  }
}