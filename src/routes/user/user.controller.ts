import { Controller, Get, Post, Put, Delete, Body, Param, Query, Patch, ParseIntPipe } from '@nestjs/common'
import { UserService } from './user.service'
import {
  CreateUserDtoType,
  UpdateUserDtoType,
  UserResponseType,
  QueryUserDtoType,
  QueryUserDto,
  CreateUserDto,
  UpdateUserDto,
} from './user.dto'
import CustomZodValidationPipe from '../../common/custom-zod-validate'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from '../../shared/constants/role.constant'
import { Auth } from '../../shared/decorators/auth.decorator'
import { AuthType } from '../../shared/constants/auth.constant'
import { Permissions } from '../../shared/decorators/permissions.decorator'
import { HTTPMethod } from '@prisma/client'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import {
  ApiGetAllUsers,
  ApiGetUserById,
  ApiCreateUser,
  ApiUpdateUser,
  ApiDeleteUser,
  ApiRestoreUser,
} from '../../swagger/user.swagger'

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@Auth([AuthType.Bearer])
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(Role.Admin)
  @Permissions({
    path: '/users',
    method: HTTPMethod.POST,
  })
  @ApiCreateUser()
  async createUser(
    @Body(new CustomZodValidationPipe(CreateUserDto))
    data: CreateUserDtoType,
  ): Promise<UserResponseType> {
    return this.userService.createUser(data)
  }

  @Put(':id')
  @Roles(Role.Admin)
  @Permissions({
    path: '/users/:id',
    method: HTTPMethod.PUT,
  })
  @ApiUpdateUser()
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateUserDto))
    data: UpdateUserDtoType,
  ): Promise<UserResponseType> {
    return this.userService.updateUser(id, data)
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @Permissions({
    path: '/users/:id',
    method: HTTPMethod.DELETE,
  })
  @ApiDeleteUser()
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.deleteUser(id)
  }

  @Get(':id')
  @Roles(Role.Admin)
  @Permissions({
    path: '/users/:id',
    method: HTTPMethod.GET,
  })
  @ApiGetUserById()
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseType> {
    return this.userService.getUserById(id)
  }

  @Get()
  @Roles(Role.Admin)
  @Permissions({
    path: '/users',
    method: HTTPMethod.GET,
  })
  @ApiGetAllUsers()
  async getUsers(@Query() query: unknown): Promise<PaginatedResponse<UserResponseType>> {
    return this.userService.getUsers(query)
  }

  @Patch(':id/restore')
  @Roles(Role.Admin)
  // @Permissions({
  //   path: '/users/:id/restore',
  //   method: HTTPMethod.PATCH,
  // })
  @ApiRestoreUser()
  async restoreUser(@Param('id', ParseIntPipe) id: number): Promise<UserResponseType> {
    return this.userService.restoreUser(id)
  }
}
