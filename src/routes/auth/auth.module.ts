import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { RolesService } from '../role/role.service'
import { AuthRepository } from '../../repositories/auth.repository'
import { RoleRepository } from '../../repositories/role.repository'
import { PermissionRepository } from '../../repositories/permission.repository'

@Module({
  providers: [AuthService, RolesService, AuthRepository, RoleRepository, PermissionRepository],
  controllers: [AuthController],
  exports: [AuthService, RolesService],
})
export class AuthModule {}
