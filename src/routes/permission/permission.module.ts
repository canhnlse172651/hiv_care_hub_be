import { Module } from '@nestjs/common'
import { PermissionService } from './permission.service'
import { PermissionController } from './permission.controller'
import { PermissionRepository } from '../../repositories/permission.repository'
import { AuthRepository } from '../../repositories/user.repository'

@Module({
  controllers: [PermissionController],
  providers: [
    PermissionService,
    PermissionRepository,
    AuthRepository
  ],
  exports: [PermissionService, PermissionRepository]
})
export class PermissionModule {}
