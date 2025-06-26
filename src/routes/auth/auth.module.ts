import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { RolesService } from '../role/role.service'
import { AuthRepository } from '../../repositories/user.repository'
import { RoleRepository } from '../../repositories/role.repository'
import { PermissionRepository } from '../../repositories/permission.repository'
import { EmailService } from '../../shared/services/email.service'

@Module({
  providers: [AuthService, RolesService, AuthRepository, RoleRepository, PermissionRepository, EmailService],
  controllers: [AuthController],
  exports: [AuthService, RolesService],
})
export class AuthModule {}
