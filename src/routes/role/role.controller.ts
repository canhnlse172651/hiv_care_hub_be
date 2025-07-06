import { Body, Controller, Delete, Get, Param, Post, Put, Query, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { RolesService } from './role.service'
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionsDto, UpdateUserRoleDto } from './role.dto'
import { Permissions } from '../../shared/decorators/permissions.decorator'
import { HTTPMethod } from '@prisma/client'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from 'src/shared/constants/role.constant'
import {
  ApiGetAllRoles,
  ApiGetRoleById,
  ApiCreateRole,
  ApiUpdateRole,
  ApiDeleteRole,
  ApiGetUserRoles,
  ApiUpdateUserRole,
} from '../../swagger/role.swagger'

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@Auth([AuthType.Bearer])
export class RoleController {
  constructor(private readonly roleService: RolesService) {}

  @Get()
  @ApiGetAllRoles()
  // @Roles(Role.Admin)
  @Permissions({
    path: '/roles',
    method: HTTPMethod.GET,
  })
  async getAllRoles(@Query() query: unknown) {
    return this.roleService.findAllRoles(query)
  }

  @Get(':id')
  @ApiGetRoleById()
  // @Roles(Role.Admin)
  @Permissions({
    path: '/roles/:id',
    method: HTTPMethod.GET,
  })
  async getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.getRoleById(id)
  }

  @Post()
  @ApiCreateRole()
  // @Roles(Role.Admin)
  @Permissions({
    path: '/roles',
    method: HTTPMethod.POST,
  })
  async createRole(@Body() body: unknown) {
    const validatedData = CreateRoleDto.create(body)
    return this.roleService.createRole(validatedData)
  }

  @Put(':id')
  @ApiUpdateRole()
  // @Roles(Role.Admin)
  @Permissions({
    path: '/roles/:id',
    method: HTTPMethod.PUT,
  })
  async updateRole(@Param('id') id: number, @Body() body: unknown) {
    const validatedData = UpdateRoleDto.create(body)
    return this.roleService.updateRole(id, validatedData)
  }

  @Delete(':id')
  @ApiDeleteRole()
  // @Roles(Role.Admin)
  @Permissions({
    path: '/roles/:id',
    method: HTTPMethod.DELETE,
  })
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return await this.roleService.deleteRole(id)
  }

  @Get('user/:userId')
  @ApiGetUserRoles()
  // @Roles(Role.Admin)
  @Permissions({
    path: '/roles/user/:userId',
    method: HTTPMethod.GET,
  })
  async getUserRole(@Param('userId', ParseIntPipe) userId: number, @Query() query: unknown) {
    return await this.roleService.getUserRole(userId)
  }

  @Put('user/:userId/roles')
  @ApiUpdateUserRole()
  // @Roles(Role.Admin)
  @Permissions({
    path: '/roles/user/:userId',
    method: HTTPMethod.PUT,
  })
  async updateUserRoles(@Param('userId') userId: string, @Body() body: unknown) {
    const validatedData = UpdateUserRoleDto.create(body)
    return this.roleService.updateUserRole(+userId, validatedData)
  }
}
