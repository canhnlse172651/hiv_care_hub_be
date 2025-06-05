import { Module } from '@nestjs/common'
import { RoleController } from './role.controller'
import { RolesService } from './role.service'
import { RoleRepository } from '../../repositories/role.repository'
import { PermissionRepository } from '../../repositories/permission.repository'
import { AuthRepository } from '../../repositories/user.repository'

@Module({
  controllers: [RoleController],
  providers: [RolesService, RoleRepository, PermissionRepository, AuthRepository],
  exports: [RolesService]
})
export class RoleModule {}
