import { Body, Controller, Delete, Get, Param, Post, Put, Query, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { PermissionService } from './permission.service'
import {
  CreatePermissionDto,
  UpdateUserPermissionsDto,
  UpdatePermissionDto,
 
} from './permission.dto'
import { Permissions } from '../../shared/decorators/permissions.decorator'
import { HTTPMethod } from '@prisma/client'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from 'src/shared/constants/role.constant'
import {
  ApiGetAllPermissions,
  ApiGetPermissionById,
  ApiCreatePermission,
  ApiUpdatePermission,
  ApiDeletePermission,
  ApiAddPermissionsToUser,
  ApiRemovePermissionsFromUser,
} from '../../swagger/permission.swagger'

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@Auth([AuthType.Bearer])
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
  ) {}

  @Get()
  // @Roles(Role.Admin)
  @Permissions({
    path: '/permissions',
    method: HTTPMethod.GET,
  })
  @ApiGetAllPermissions()
  async getAllPermissions(@Query() query: unknown) {
    return this.permissionService.getAllPermissions(query);
  }

  @Get(':id')
  // @Roles(Role.Admin)
  @Permissions({
    path: '/permissions/:id',
    method: HTTPMethod.GET,
  })
  @ApiGetPermissionById()
  async getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.getPermissionById(id)
  }

  @Post()
  // @Roles(Role.Admin)
  @Permissions({
    path: '/permissions',
    method: HTTPMethod.POST,
  })
  @ApiCreatePermission()
  async createPermission(@Body() body: unknown) {
    const validatedData = CreatePermissionDto.create(body)
    return this.permissionService.createPermission(validatedData)
  }

  @Put(':id')
  // @Roles(Role.Admin)
  @Permissions({
    path: '/permissions/:id',
    method: HTTPMethod.PUT,
  })
  @ApiUpdatePermission()
  async updatePermission(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const validatedData = UpdatePermissionDto.create(body)
    return await this.permissionService.updatePermission(id, validatedData)
  }

  @Delete(':id')
  // @Roles(Role.Admin)
  @Permissions({
    path: '/permissions/:id',
    method: HTTPMethod.DELETE,
  })
  @ApiDeletePermission()
  async deletePermission(@Param('id') id: number) {
    return this.permissionService.deletePermission(id)
  }

  // New endpoints for user permissions

  @Post('user/:userId')
  // @Roles(Role.Admin)
  @Permissions({
    path: '/permissions/user/:userId',
    method: HTTPMethod.POST,
  })
  @ApiAddPermissionsToUser()
  async addPermissionsToUser(@Param('userId', ParseIntPipe) userId: number, @Body() body: unknown) {
    const validatedData = UpdateUserPermissionsDto.create(body)
    return await this.permissionService.addPermissionsToUser(userId, validatedData.permissions)
  }

  @Delete('user/:userId')
  //  @Roles(Role.Admin)
  @Permissions({
    path: '/permissions/user/:userId',
    method: HTTPMethod.DELETE,
  })
  @ApiRemovePermissionsFromUser()
  async removePermissionsFromUser(@Param('userId', ParseIntPipe) userId: number, @Body() body: unknown) {
    const validatedData = UpdateUserPermissionsDto.create(body)
    return await this.permissionService.removePermissionsFromUser(userId, validatedData.permissions)
  }
}
