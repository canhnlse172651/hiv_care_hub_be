import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { RoleRepository } from '../../repositories/role.repository'
import { PermissionRepository } from '../../repositories/permission.repository'
import { CreateRoleType, UpdateRoleType, RoleResType, QueryRoleType, UpdateUserRolesType, UpdateUserRoleType } from './role.model'
import { AuthRepository } from 'src/repositories/auth.repository'

@Injectable()
export class RolesService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly authRepository: AuthRepository
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

  async getAllRoles(query: QueryRoleType): Promise<RoleResType[]> {
    return this.roleRepository.getAllRoles(query)
  }

  async getClientRoleId(): Promise<number> {
    const clientRole = await this.roleRepository.findRoleByName('CLIENT')
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
      console.log('Service: Starting update user role. UserId:', userId, 'Data:', data);

      // Check if user exists
      const user = await this.authRepository.findUserById(userId);
      console.log('Service: Found user:', user);
      
      if (!user) {
        console.log('Service: User not found with ID:', userId);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Verify role exists
      const role = await this.roleRepository.findRoleById(data.roleId);
      console.log('Service: Found role:', role);
      
      if (!role) {
        console.log('Service: Role not found with ID:', data.roleId);
        throw new NotFoundException(`Role with ID ${data.roleId} not found`);
      }

      console.log('Service: Proceeding with role update');
      const result = await this.roleRepository.updateUserRole(userId, data.roleId);
      console.log('Service: Update result:', result);
      
      return result;
    } catch (error) {
      console.error('Service: Error in updateUserRole:', error);
      throw error;
    }
  }
}