import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import envConfig from 'src/shared/config'
import { TokenPayload } from 'src/shared/types/jwt.type'

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: { userId: number }) {
    console.log('Creating access token with payload:', payload);
    const token = this.jwtService.sign(payload, {
      secret: envConfig.ACCESS_TOKEN_SECRET,
      expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN,
      algorithm: 'HS256',
    });
    console.log('Generated access token:', token);
    return token;
  }

  signRefreshToken(payload: { userId: number }) {
    console.log('Creating refresh token with payload:', payload);
    const token = this.jwtService.sign(payload, {
      secret: envConfig.REFRESH_TOKEN_SECRET,
      expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN,
      algorithm: 'HS256',
    });
    console.log('Generated refresh token:', token);
    return token;
  }

  verifyAccessToken(token: string): Promise<TokenPayload> {
    console.log('Verifying access token:', token);
    console.log('Using access token secret:', envConfig.ACCESS_TOKEN_SECRET);
    return this.jwtService.verifyAsync(token, {
      secret: envConfig.ACCESS_TOKEN_SECRET,
    });
  }

  verifyRefreshToken(token: string): Promise<TokenPayload> {
    console.log('Verifying refresh token:', token);
    console.log('Using refresh token secret:', envConfig.REFRESH_TOKEN_SECRET);
    return this.jwtService.verifyAsync(token, {
      secret: envConfig.REFRESH_TOKEN_SECRET,
      ignoreExpiration: true // Allow expired tokens to be verified
    });
  }
}
