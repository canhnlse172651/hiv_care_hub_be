import { Injectable, UnauthorizedException } from "@nestjs/common";
import { google } from 'googleapis'
import envConfig from "src/shared/config";
import { randomBytes } from 'crypto';
import { AuthRepository } from "../../repositories/user.repository";
import { RolesService } from "../role/role.service";
import { TokenService } from "src/shared/services/token.service";
import { AuthService } from "./auth.service";
import { HashingService } from "src/shared/services/hashing.service";
import { EmailService } from "src/shared/services/email.service";

@Injectable()
export class GoogleService {
    private oauth2Client

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly rolesService: RolesService,
    private readonly tokenService: TokenService,
    private readonly hashingService: HashingService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ){
    this.oauth2Client = new google.auth.OAuth2( 
       envConfig.GOOGLE_CLIENT_ID,
       envConfig.GOOGLE_CLIENT_SECRET,
       envConfig.GOOGLE_REDIRECT_URI
    )
  }

  async getAuthorizationUrl() {
    const scope = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ]

    // Generate random state for CSRF protection
    const state = randomBytes(32).toString('hex')

    const url = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scope,
        state: state,
        include_granted_scopes: true,
    })
    
    return  url 
  }
  
  async googleCallback({ code, state }: { code: string; state: string }) {
    try {
      // 2. Dùng code để lấy token
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      // 3. Lấy thông tin google user
      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2',
      })
      const { data } = await oauth2.userinfo.get()
      if (!data.email) {
        throw new Error('Không thể lấy thông tin người dùng từ google')
      }

      let user = await this.authRepository.findUserByEmail(data.email)
      let isNewUser = false;
      
      // Nếu không có user tức là người mới, vậy nên sẽ tiến hành đăng ký
      if (!user) {
        isNewUser = true;
        const clientRoleId = await this.rolesService.getClientRoleId()
        
        // Tạo password ngẫu nhiên 8 ký tự
        const randomPassword = randomBytes(4).toString('hex').toUpperCase();
        const hashedPassword = await this.hashingService.hash(randomPassword)
        
        user = await this.authRepository.createUserInclueRole({
          email: data.email,
          name: data.name ?? '',
          password: hashedPassword,
          roleId: clientRoleId,
          phoneNumber: '',
          avatar: data.picture ?? null,
        })

        // Gửi email với password
        try {
          await this.emailService.sendWelcomeEmail({
            email: data.email,
            name: data.name || 'User',
            password: randomPassword,
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Không throw error vì user đã được tạo thành công
        }
      }
      
      const authTokens = await this.authService.generateTokens({
        userId: user.id,
      })

      // Return in the format expected by frontend
      return {
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.name || 'PATIENT',
          avatar: user.avatar || data.picture,
        },
        isNewUser, // Thêm flag để frontend biết đây là user mới
      }
    } catch (error) {
      console.error('Error in googleCallback', error)
      throw error
    }
  }

  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: envConfig.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      return payload;
    } catch (error) {
      console.error('Google token verification error:', error);
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
