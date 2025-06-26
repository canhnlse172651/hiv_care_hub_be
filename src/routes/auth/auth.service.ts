import { Injectable, ConflictException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { RolesService } from '../role/role.service'
import { TokenService } from 'src/shared/services/token.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { AuthRepository } from '../../repositories/user.repository'
import { LoginBodyType, RegisterBodyType, SentOtpType } from './auth.model'
import { generateOtp } from 'src/shared/utils/otp.utils'
import { addMilliseconds } from 'date-fns'
import envConfig from 'src/shared/config'
import ms from 'ms'
import { EmailService } from 'src/shared/services/email.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly rolesService: RolesService,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  async register(body: RegisterBodyType) {
    try {

      const verificationCode = await this.authRepository.findVerificationCode({
        email: body.email,
        type: 'REGISTER',
        code: body.code,
      })

      if (!verificationCode) {
        throw new UnprocessableEntityException({
          message: 'Invalid verification code',
          field: 'code',
        })
      }

      // Add detailed logging for expiration check
      const now = new Date()
     

      // Alternative check using getTime() for more reliable comparison
      const isExpired = verificationCode.expiresAt.getTime() < now.getTime()
   

      if(isExpired) {
        throw new UnprocessableEntityException({
          message: 'Verification code has expired',
          field: 'code',
        })
      }
      
      
      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      return await this.authRepository.createUser({
        email: body.email,
        name: body.name,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        roleId: clientRoleId,
        
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        console.log('error service  ', error)
        throw new ConflictException('Email already exists')
      }

      console.log('error service2  ', error)
      throw error
    }
  }

  async login(body: LoginBodyType) {
    const user = await this.authRepository.findUserByEmail(body.email)

    if (!user) {
      throw new UnauthorizedException('Account does not exist')
    }

    const isPasswordValid = await this.hashingService.compare(body.password, user.password)

    if (!isPasswordValid) {
      throw new UnprocessableEntityException([
        {
          field: 'password',
          error: 'Password is incorrect',
        },
      ])
    }

    const tokens = await this.generateTokens({ userId: user.id })
 

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name || 'UNKNOWN'
      }
    }
  }

  async generateTokens(payload: { userId: number }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken(payload),
    ])

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)

    const storedToken = await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId: payload.userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    })

    if (!storedToken) {
      throw new UnauthorizedException('Failed to store refresh token')
    }

    return { accessToken, refreshToken }
  }

  async refreshToken(refreshToken: string) {
    try {
      // First verify the token
      const decodedToken = await this.tokenService.verifyRefreshToken(refreshToken)

      // Check if token exists in database
      const existingToken = await this.authRepository.findRefreshToken(refreshToken)

      if (!existingToken) {
        console.log('Token not found in database')
        throw new UnauthorizedException('Refresh token has been revoked')
      }

      // Delete old token first
      const deletedToken = await this.authRepository.deleteRefreshToken(refreshToken)

      

      // Generate new tokens
      const newTokens = await this.generateTokens({ userId: decodedToken.userId })

      return newTokens
    } catch (error) {
      console.error('Refresh token error:', error)
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked')
      }
      if (error.message?.includes('expired')) {
        throw new UnauthorizedException('Refresh token has expired')
      }
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(refreshToken: string) {
    try {
      // Check if token exists in database first
      const existingToken = await this.authRepository.findRefreshToken(refreshToken)

      if (!existingToken) {
        throw new UnauthorizedException('Refresh token not found in database')
      }

      try {
        // Try to verify the refresh token
        const decodedToken = await this.tokenService.verifyRefreshToken(refreshToken)
        console.log('Decoded token:', decodedToken)
      } catch (error) {
        // If token is expired, we still want to delete it from DB
        console.log('Token verification failed:', error.message)
        if (!error.message.includes('expired')) {
          throw error
        }
      }

      // Delete the refresh token from database
      const deleted = await this.authRepository.deleteRefreshToken(refreshToken)
      console.log('Deleted token:', deleted)

      return { message: 'Logout successfully' }
    } catch (error) {
      console.error('Logout error:', error)
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException('Invalid refresh token')
    }
  }


  async sentOtp(body: SentOtpType) {
    try {
      console.log('Starting sentOtp with body:', body)

      // check email already exists on database
      console.log('Checking if email exists...')
      const user = await this.authRepository.findUserByEmail(body.email)
      console.log('User found:', user)
      
      if (user) {
        throw new ConflictException('Email already exists')
      }

      // generate otp
      console.log('Generating OTP...')
      const otp = generateOtp()
      console.log('Generated OTP:', otp)

      // Validate environment variable
      const expirationTime = envConfig.OTP_EXPIRES_IN || '5m'
      console.log('Raw OTP_EXPIRATION_TIME from env:', envConfig.OTP_EXPIRES_IN)
      console.log('Using expiration time:', expirationTime)
      console.log('Calculated milliseconds:', ms(expirationTime))
      console.log('OTP expiration time:', expirationTime)

      console.log('Creating verification code with params:', {
        email: body.email,
        type: body.type,
        expiresAt: addMilliseconds(new Date(), ms(expirationTime))
      })

      const verificationCode = await this.authRepository.createVerificationCode({
        email: body.email,
        code: otp.toString(),
        type: body.type,
        expiresAt: addMilliseconds(new Date(), ms(expirationTime)),
      })

      // Send OTP via email
      try {
        await this.emailService.sendOTP({
          email: body.email,
          code: otp.toString()
        })
        console.log('OTP email sent successfully')
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError)
        // Don't throw error, just log it for now
      }

      console.log('Verification code created:', verificationCode)
      return {
        message: 'OTP sent successfully to your email',
        email: body.email,
        type: body.type
      }

    } catch (error) {
      console.error('Error in sentOtp:', error)
      console.error('Error stack:', error.stack)
      throw error
    }
  }
}
