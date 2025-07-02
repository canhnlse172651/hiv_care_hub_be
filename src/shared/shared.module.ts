import { Global, Module } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.service'
import { JwtModule } from '@nestjs/jwt'
import { APP_GUARD } from '@nestjs/core'
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard'
import { RolesGuard } from './guards/roles.guard'
import { PermissionsGuard } from './guards/permissions.guard'
import { AccessTokenGuard } from './guards/access-token.guard'
import { APIKeyGuard } from './guards/api-key.guard'
import { PaginationService } from './services/pagination.service'
import { SharedErrorHandlingService } from './services/error-handling.service'
import { TwoFactorService } from './services/2fa.service'

const sharedServices = [PrismaService, HashingService, TokenService, PaginationService, SharedErrorHandlingService, TwoFactorService]
const sharedGuards = [AccessTokenGuard, APIKeyGuard]

@Global()
@Module({
  providers: [
    ...sharedServices,
    ...sharedGuards,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [...sharedServices, ...sharedGuards],
  imports: [JwtModule],
})
export class SharedModule {}
