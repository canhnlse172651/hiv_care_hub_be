import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { RoleRepository } from '../../repositories/role.repository'
import { PermissionRepository } from '../../repositories/permission.repository'
import { CreateRoleType, UpdateRoleType, RoleResType, QueryRoleType, UpdateUserRolesType, UpdateUserRoleType, QueryRoleSchema } from './role.model'
import { AuthRepository } from 'src/repositories/user.repository'
import { PaginationService } from '../../shared/services/pagination.service'
import { createPaginationSchema, PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { z } from 'zod'
import { Role, Permission } from '@prisma/client'

@Injectable()
export class RolesService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly authRepository: AuthRepository,
    private readonly paginationService: PaginationService
  ) {}

  async createRole(data: CreateRoleType): Promise<RoleResType> {
    const existingRole = await this.roleRepository.findRoleByName(data.name)
    if (existingRole) {
      throw new ConflictException('Role name already exists')
    }

    // Verify all permissions exist
    for (const permissionId of data.permissions) {
      const permission = await this.permissionRepository.findPermissionById(permissionId)
      if (!permission) {
        throw new NotFoundException(`Permission with ID ${permissionId} not found`)
      }
    }

    return this.roleRepository.createRole(data)
  }

  async updateRole(id: number, data: UpdateRoleType): Promise<RoleResType> {
    const role = await this.roleRepository.findRoleById(id)
    if (!role) {
      throw new NotFoundException('Role not found')
    }

    if (data.name && data.name !== role.name) {
      const existingRole = await this.roleRepository.findRoleByName(data.name)
      if (existingRole) {
        throw new ConflictException('Role name already exists')
      }
    }

    if (data.permissions) {
      // Verify all permissions exist
      for (const permissionId of data.permissions) {
        const permission = await this.permissionRepository.findPermissionById(permissionId)
        if (!permission) {
          throw new NotFoundException(`Permission with ID ${permissionId} not found`)
        }
      }
    }

    return this.roleRepository.updateRole(id, data)
  }

  async deleteRole(id: number): Promise<RoleResType> {
    const role = await this.roleRepository.findRoleById(id)
    if (!role) {
      throw new NotFoundException('Role not found')
    }

    return this.roleRepository.deleteRole(id)
  }

  async getRoleById(id: number): Promise<RoleResType> {
    try {
      const role = await this.roleRepository.findRoleById(id)
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`)
      }
      return role
    } catch (error) {
      console.error('Error in getRoleById:', error)
      throw error
    }
  }

  async findAllRoles(query: unknown): Promise<PaginatedResponse<RoleResType>> {
    try {
      // Parse pagination options
      const paginationOptions = createPaginationSchema(QueryRoleSchema).parse(query);
      
      // Build where condition for search
      const where: any = {};

      // Add search conditions if search term is provided
      if (paginationOptions.search) {
        where.OR = paginationOptions.searchFields.map(field => ({
          [field]: {
            contains: paginationOptions.search,
            mode: 'insensitive'
          }
        }));
      }

      // Get paginated data using Prisma model
      const result = await this.paginationService.paginate(
        this.roleRepository.getRoleModel(),
        paginationOptions,
        where,
        {
          permissions: true
        }
      ) as PaginatedResponse<RoleResType>;

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Error finding roles: ' + error.message);
    }
  }

  async getClientRoleId(): Promise<number> {
    const clientRole = await this.roleRepository.findRoleByName('PATIENT')
    if (!clientRole) {
      throw new NotFoundException('Client role not found')
    }
    return clientRole.id
  }

  async addPermissionsToRole(id: number, permissionIds: number[]): Promise<RoleResType> {
    const role = await this.roleRepository.findRoleById(id)
    if (!role) {
      throw new NotFoundException('Role not found')
    }

    return this.roleRepository.updateRole(id, {
      permissions: [...role.permissions.map(p => p.id), ...permissionIds]
    })
  }

  async removePermissionsFromRole(id: number, permissionIds: number[]): Promise<RoleResType> {
    const role = await this.roleRepository.findRoleById(id)
    if (!role) {
      throw new NotFoundException('Role not found')
    }

    return this.roleRepository.updateRole(id, {
      permissions: role.permissions.map(p => p.id).filter(id => !permissionIds.includes(id))
    })
  }

  async getUserRoles(userId: number): Promise<RoleResType[]> {
    // Check if user exists
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    return this.roleRepository.getUserRoles(userId)
  }

  async addRolesToUser(userId: number, data: UpdateUserRolesType): Promise<RoleResType[]> {
    // Check if user exists
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    // Verify all roles exist
    for (const roleId of data.roles) {
      const role = await this.roleRepository.findRoleById(roleId)
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`)
      }
    }

    return this.roleRepository.addRolesToUser(userId, data.roles)
  }

  async removeRolesFromUser(userId: number, data: UpdateUserRolesType): Promise<RoleResType[]> {
    // Check if user exists
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    // Verify all roles exist
    for (const roleId of data.roles) {
      const role = await this.roleRepository.findRoleById(roleId)
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`)
      }
    }

    return this.roleRepository.removeRolesFromUser(userId, data.roles)
  }

  async getUserRole(userId: number): Promise<RoleResType | null> {
    // Check if user exists
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    return this.roleRepository.getUserRole(userId)
  }

  async updateUserRole(userId: number, data: UpdateUserRoleType): Promise<RoleResType | null> {
    try {

      // Check if user exists
      const user = await this.authRepository.findUserById(userId);
     
      
      if (!user) {
        console.log('Service: User not found with ID:', userId);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Verify role exists
      const role = await this.roleRepository.findRoleById(data.roleId);
     
      
      if (!role) {
        console.log('Service: Role not found with ID:', data.roleId);
        throw new NotFoundException(`Role with ID ${data.roleId} not found`);
      }

    
      const result = await this.roleRepository.updateUserRole(userId, data.roleId);
    
      
      return result;
    } catch (error) {
      console.error('Service: Error in updateUserRole:', error);
      throw error;
    }
  }
}