import { Injectable, ConflictException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { RolesService } from '../role/role.service'
import { TokenService } from 'src/shared/services/token.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { AuthRepository } from '../../repositories/user.repository'
import {
  ForgotPasswordBodyType,
  LoginBodyType,
  RegisterBodyType,
  SentOtpType,
  Disable2FaBodyType,
  UpdateProfileType,
} from './auth.model'
import { generateOtp } from 'src/shared/utils/otp.utils'
import { addMilliseconds } from 'date-fns'
import envConfig from 'src/shared/config'
import ms, { StringValue } from 'ms'
import { EmailService } from 'src/shared/services/email.service'
import { TwoFactorService } from 'src/shared/services/2fa.service'
import { InvalidTOTPAndCodeException, TOTPNotEnabledException } from './error.model'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly rolesService: RolesService,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly twoFactorService: TwoFactorService,
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

      const isExpired = verificationCode.expiresAt.getTime() < now.getTime()

      if (isExpired) {
        throw new UnprocessableEntityException({
          message: 'Verification code has expired',
          field: 'code',
        })
      }

      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          name: body.name,
          phoneNumber: body.phoneNumber,
          password: hashedPassword,
          roleId: clientRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email: body.email,
          code: body.code,
          type: 'REGISTER',
        }),
      ])

      return user
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
    console.log('body', body)
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

    // 2. Nếu user đã bật mã 2FA thì kiểm tra mã 2FA TOTP Code hoặc OTP Code (email)Add commentMore actions
    if (user.totpSecret) {
      // Nếu không có mã TOTP Code và Code thì thông báo cho client biết
      if (!body.totpCode && !body.code) {
        console.log('No TOTP code or OTP code provided')
        throw InvalidTOTPAndCodeException
      }

      // Kiểm tra TOTP Code có hợp lệ hay không
      if (body.totpCode) {
        console.log('Verifying TOTP code...')
        const isValid = this.twoFactorService.verifyTOTP({
          email: user.email,
          secret: user.totpSecret,
          token: body.totpCode,
        })
        if (!isValid) {
          console.log('TOTP verification failed')
          throw InvalidTOTPAndCodeException
        }
      } else if (body.code) {
        // Kiểm tra mã OTP có hợp lệ không
        const verificationCode = await this.authRepository.findVerificationCode({
          email: user.email,
          code: body.code,
          type: 'LOGIN',
        })
        console.log('Verification code found:', !!verificationCode)
        if (!verificationCode) {
          console.log('Invalid verification code')
          throw new UnprocessableEntityException('Invalid verification code')
        }
        if (verificationCode.expiresAt.getTime() < new Date().getTime()) {
          console.log('Verification code expired')
          throw new UnprocessableEntityException('Verification code has expired')
        }
      }
    }

    const tokens = await this.generateTokens({ userId: user.id })

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name || 'UNKNOWN',
      },
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
      // check email already exists on database

      const user = await this.authRepository.findUserByEmail(body.email)

      if (body.type === 'REGISTER' && user) {
        throw new ConflictException('Email already exists')
      }
      if (body.type === 'FORGOT_PASSWORD' && !user) {
        throw new UnprocessableEntityException('Email not found')
      }

      // generate otp

      const otp = generateOtp()

      // Validate environment variable
      const expirationTime = envConfig.OTP_EXPIRES_IN || '5m'

      await this.authRepository.createVerificationCode({
        email: body.email,
        code: otp.toString(),
        type: body.type as 'FORGOT_PASSWORD' | 'REGISTER' | 'DISABLE_2FA' | 'LOGIN',
        expiresAt: addMilliseconds(new Date(), ms(expirationTime as StringValue)),
      })

      // Send OTP via email
      try {
        await this.emailService.sendOTP({
          email: body.email,
          code: otp.toString(),
        })
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError)
        // Don't throw error, just log it for now
      }
    } catch (error) {
      console.error('Error in sentOtp:', error)

      throw error
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, code, newPassword } = body
    // 1. Kiểm tra email đã tồn tại trong database chưa
    const user = await this.authRepository.findUserByEmail(email)

    if (!user) {
      throw new UnprocessableEntityException('Email not found')
    }

    //2. Kiểm tra mã OTP có hợp lệ không
    const verificationCode = await this.authRepository.findVerificationCode({
      email,
      code,
      type: 'FORGOT_PASSWORD',
    })

    if (!verificationCode) {
      throw new UnprocessableEntityException({
        message: 'Invalid verification code',
        field: 'code',
      })
    }

    // Kiểm tra OTP có hết hạn chưa
    const now = new Date()
    const isExpired = verificationCode.expiresAt.getTime() < now.getTime()

    if (isExpired) {
      throw new UnprocessableEntityException({
        message: 'Verification code has expired',
        field: 'code',
      })
    }

    //3. Cập nhật lại mật khẩu mới và xóa đi OTP
    const hashedPassword = await this.hashingService.hash(newPassword)
    await Promise.all([
      this.authRepository.updateUser(user.id, {
        password: hashedPassword,
      }),
      this.authRepository.deleteVerificationCode({
        email: body.email,
        code: body.code,
        type: 'FORGOT_PASSWORD',
      }),
    ])
    return {
      message: 'Change password successfully',
    }
  }

  async setupTwoFactorAuth(userId: number) {
    try {
      // 1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không, và xem họ đã bật 2FA chưa
      const user = await this.authRepository.findUserById(userId)
      if (!user) {
        throw new UnprocessableEntityException('User not found')
      }
      if (user.totpSecret) {
        throw new UnprocessableEntityException('2FA already enabled')
      }
      // 2. Tạo ra secret và uri
      const { secret, uri } = this.twoFactorService.generateTOTPSecret(user.email)
      // 3. Cập nhật secret vào user trong database
      await this.authRepository.updateUser(userId, { totpSecret: secret })
      // 4. Trả về secret và uri
      return {
        secret,
        uri,
      }
    } catch (error) {
      console.error('Error in setupTwoFactorAuth:', error)
      throw error
    }
  }

  async disableTwoFactorAuth(data: Disable2FaBodyType & { userId: number }) {
    const { userId, totpCode, code } = data
    // 1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không, và xem họ đã bật 2FA chưa
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new UnprocessableEntityException('User not found')
    }
    if (!user.totpSecret) {
      throw TOTPNotEnabledException
    }

    // 2. Kiểm tra mã TOTP có hợp lệ hay không
    if (totpCode) {
      const isValid = this.twoFactorService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode,
      })
      if (!isValid) {
        throw InvalidTOTPAndCodeException
      }
    } else if (code) {
      // 3. Kiểm tra mã OTP email có hợp lệ hay không
      const verificationCode = await this.authRepository.findVerificationCode({
        email: user.email,
        code,
        type: 'DISABLE_2FA',
      })

      if (!verificationCode) {
        throw new UnprocessableEntityException('Invalid verification code')
      }

      // Kiểm tra OTP có hết hạn chưa
      const now = new Date()
      const isExpired = verificationCode.expiresAt.getTime() < now.getTime()

      if (isExpired) {
        throw new UnprocessableEntityException('Verification code has expired')
      }
    } else {
      // Nếu không có TOTP code và OTP code thì throw error
      throw InvalidTOTPAndCodeException
    }

    // 4. Cập nhật secret thành null
    await this.authRepository.updateUser(userId, { totpSecret: null })

    // 5. Trả về thông báo
    return {
      message: 'Tắt 2FA thành công',
    }
  }

  async getUserProfile(userId: number) {
    const user = await this.authRepository.findUserByIdWithDoctorId(userId)
    if (!user) {
      throw new UnprocessableEntityException('User not found')
    }
    return user
  }

  async updateUserProfile(userId: number, data: UpdateProfileType) {
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new UnprocessableEntityException('User not found')
    }
    const updatedUser = await this.authRepository.updateUser(userId, data)
    return {
      updatedUser,
    }
  }
}
