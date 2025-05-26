import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesService } from './role.service';
import { AuthRepository } from './repositories/auth.repository';
import { PrismaService } from 'src/shared/services/prisma.service';
import { TokenService } from 'src/shared/services/token.service';
import { HashingService } from 'src/shared/services/hashing.service';

@Module({
  providers: [
    AuthService,
    RolesService,
    AuthRepository,
  ],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
