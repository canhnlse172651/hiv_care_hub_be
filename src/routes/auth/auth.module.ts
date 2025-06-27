import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { RolesService } from '../role/role.service'
import { AuthRepository } from '../../repositories/user.repository'
import { RoleRepository } from '../../repositories/role.repository'
import { PermissionRepository } from '../../repositories/permission.repository'
import { GoogleService } from './google.service'
import { EmailService } from '../../shared/services/email.service'

@Module({
  providers: [AuthService, RolesService, AuthRepository, RoleRepository, PermissionRepository, GoogleService, EmailService],
  controllers: [AuthController],
  exports: [AuthService, RolesService, GoogleService],
})
export class AuthModule {}
