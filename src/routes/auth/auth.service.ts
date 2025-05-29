import { Injectable, ConflictException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { RolesService } from '../role/role.service'
import { TokenService } from 'src/shared/services/token.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { AuthRepository } from '../../repositories/auth.repository'
import { LoginBodyType, RegisterBodyType } from './auth.model'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly rolesService: RolesService,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
   
  ) {}

  async register(body: RegisterBodyType) {
    try {
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
        console.log("error service  ", error)
        throw new ConflictException('Email already exists')
      }

      console.log("error service2  ", error)
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
    console.log('=== Generated Tokens ===')
    console.log('Access Token:', tokens.accessToken)
    console.log('Refresh Token:', tokens.refreshToken)
    console.log('=====================')
    return tokens
  }

  async generateTokens(payload: { userId: number }) {
    console.log('=== Generating Tokens ===');
    console.log('User ID:', payload.userId);
    
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken(payload),
    ]);
    
    console.log('Generated tokens:', { 
      accessToken,
      refreshToken,
      refreshTokenLength: refreshToken.length
    });
    
    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken);
    console.log('Decoded refresh token:', {
      userId: decodedRefreshToken.userId,
      iat: new Date(decodedRefreshToken.iat * 1000).toISOString(),
      exp: new Date(decodedRefreshToken.exp * 1000).toISOString()
    });
    
    const storedToken = await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId: payload.userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    });
    
    console.log('Stored token in DB:', {
      token: storedToken.token,
      tokenLength: storedToken.token.length,
      userId: storedToken.userId,
      expiresAt: storedToken.expiresAt
    });
    
    console.log('=== End Generating Tokens ===');
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      console.log('=== Refresh Token Process ===');
      console.log('Received refresh token:', {
        token: refreshToken,
        length: refreshToken.length
      });

      // First verify the token
      const decodedToken = await this.tokenService.verifyRefreshToken(refreshToken);
      console.log('Decoded token:', {
        userId: decodedToken.userId,
        iat: new Date(decodedToken.iat * 1000).toISOString(),
        exp: new Date(decodedToken.exp * 1000).toISOString()
      });

      // Check if token exists in database
      const existingToken = await this.authRepository.findRefreshToken(refreshToken);
      console.log('Existing token in DB:', existingToken ? {
        token: existingToken.token,
        tokenLength: existingToken.token.length,
        userId: existingToken.userId,
        expiresAt: existingToken.expiresAt
      } : null);
      
      if (!existingToken) {
        console.log('Token not found in database');
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Delete old token first
      const deletedToken = await this.authRepository.deleteRefreshToken(refreshToken);
      console.log('Deleted old token:', {
        token: deletedToken.token,
        tokenLength: deletedToken.token.length,
        userId: deletedToken.userId,
        expiresAt: deletedToken.expiresAt
      });
      
      // Generate new tokens
      const newTokens = await this.generateTokens({ userId: decodedToken.userId });
      console.log('Generated new tokens:', {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        refreshTokenLength: newTokens.refreshToken.length
      });

      console.log('=== End Refresh Token Process ===');
      return newTokens;
    } catch (error) {
      console.error('Refresh token error:', error);
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }
      if (error.message?.includes('expired')) {
        throw new UnauthorizedException('Refresh token has expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      console.log('=== Logout Process ===');
      console.log('Attempting to logout with token:', {
        token: refreshToken,
        length: refreshToken.length
      });
      
      // Check if token exists in database first
      const existingToken = await this.authRepository.findRefreshToken(refreshToken);
      console.log('Existing token in DB:', existingToken ? {
        token: existingToken.token,
        tokenLength: existingToken.token.length,
        userId: existingToken.userId,
        expiresAt: existingToken.expiresAt
      } : null);
      
      if (!existingToken) {
        throw new UnauthorizedException('Refresh token not found in database');
      }

      try {
        // Try to verify the refresh token
        const decodedToken = await this.tokenService.verifyRefreshToken(refreshToken);
        console.log('Decoded token:', {
          userId: decodedToken.userId,
          iat: new Date(decodedToken.iat * 1000).toISOString(),
          exp: new Date(decodedToken.exp * 1000).toISOString()
        });
      } catch (error) {
        // If token is expired, we still want to delete it from DB
        console.log('Token verification failed:', error.message);
        if (!error.message.includes('expired')) {
          throw error;
        }
      }

      // Delete the refresh token from database
      const deleted = await this.authRepository.deleteRefreshToken(refreshToken);
      console.log('Token deletion result:', {
        token: deleted.token,
        tokenLength: deleted.token.length,
        userId: deleted.userId,
        expiresAt: deleted.expiresAt
      });

      console.log('=== End Logout Process ===');
      return { message: 'Logout successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
