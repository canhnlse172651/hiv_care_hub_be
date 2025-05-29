import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PermissionRepository } from '../../repositories/permission.repository'
import { HTTPMethod } from '@prisma/client'
import { CreatePermissionType, UpdatePermissionType, PermissionResType, QueryPermissionType } from './permission.model'
import { AuthRepository } from '../../repositories/auth.repository'
import { PrismaService } from '../../shared/services/prisma.service'

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepository: PermissionRepository,
    private readonly authRepository: AuthRepository,
    private readonly prisma: PrismaService
  ) {}

  async createPermission(data: CreatePermissionType): Promise<PermissionResType> {
    try {
      console.log('Service: Starting permission creation with data:', data);

      // Check if permission already exists
      const existingPermission = await this.permissionRepository.findPermissionByPathAndMethod(
        data.path,
        data.method
      );
      console.log('Service: Existing permission check:', existingPermission);

      if (existingPermission) {
        console.log('Service: Permission already exists');
        throw new ConflictException('Permission with this path and method already exists');
      }

      // Generate name from path and method
      const name = `${data.method} ${data.path}`.replace(/\//g, ' ').trim();
      const permissionData = {
        ...data,
        name
      };

      console.log('Service: Creating new permission with data:', permissionData);
      const newPermission = await this.permissionRepository.createPermission(permissionData);
      console.log('Service: Permission created successfully:', newPermission);

      return newPermission;
    } catch (error) {
      console.error('Service: Error in createPermission:', error);
      throw error;
    }
  }

  async updatePermission(id: number, data: UpdatePermissionType): Promise<PermissionResType> {
    try {
      console.log('Service: Starting permission update. ID:', id, 'Data:', data);

      // Check if permission exists
      const permission = await this.permissionRepository.findPermissionById(id);
      console.log('Service: Found permission:', permission);

      if (!permission) {
        console.log('Service: Permission not found with ID:', id);
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      // Check if new path and method combination already exists
      if (data.path && data.method) {
        const existingPermission = await this.permissionRepository.findPermissionByPathAndMethod(
          data.path,
          data.method
        );
        console.log('Service: Existing permission check:', existingPermission);

        if (existingPermission && existingPermission.id !== id) {
          console.log('Service: Permission with same path and method already exists');
          throw new ConflictException('Permission with this path and method already exists');
        }
      }

      // Generate name if path or method is updated
      let updateData = { ...data };
      if (data.path || data.method) {
        const newPath = data.path || permission.path;
        const newMethod = data.method || permission.method;
        updateData.name = `${newMethod} ${newPath}`.replace(/\//g, ' ').trim();
      }

      // Remove isActive field if it exists
      delete updateData.isActive;

      console.log('Service: Updating permission with data:', updateData);
      const updatedPermission = await this.permissionRepository.updatePermission(id, updateData);
      console.log('Service: Permission updated successfully:', updatedPermission);

      return updatedPermission;
    } catch (error) {
      console.error('Service: Error in updatePermission:', error);
      throw error;
    }
  }

  async deletePermission(id: number): Promise<PermissionResType> {
    const permission = await this.permissionRepository.findPermissionById(id)
    if (!permission) {
      throw new NotFoundException('Permission not found')
    }

    return this.permissionRepository.deletePermission(id)
  }

  async getPermissionById(id: number): Promise<PermissionResType> {
    try {
    
      const permission = await this.permissionRepository.findPermissionById(id);
   
      
      if (!permission) {
       
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      return permission;
    } catch (error) {
      console.error('Service: Error in getPermissionById:', error);
      throw error;
    }
  }

  async getAllPermissions(query?: QueryPermissionType): Promise<PermissionResType[]> {
    return this.permissionRepository.getAllPermissions(query)
  }

  async checkPermission(path: string, method: HTTPMethod): Promise<PermissionResType | null> {
    return this.permissionRepository.findPermissionByPathAndMethod(path, method)
  }

  // New methods for user permissions
  async getUserPermissions(userId: number): Promise<PermissionResType[]> {
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    return this.permissionRepository.getUserPermissions(userId)
  }

  async addPermissionsToUser(userId: number, permissionIds: number[]): Promise<PermissionResType[]> {
    try {
      console.log('Service: Starting add permissions to user. UserId:', userId, 'PermissionIds:', permissionIds);

      // Check if user exists
      const user = await this.authRepository.findUserById(userId);
      console.log('Service: Found user:', user);
      
      if (!user) {
        console.log('Service: User not found with ID:', userId);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get user's current permissions from both role and direct permissions
      const userWithPermissions = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: true
            }
          },
          permissions: true
        }
      });

      if (!userWithPermissions) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Combine role permissions and direct user permissions
      const existingPermissions = [
        ...(userWithPermissions.role?.permissions || []),
        ...(userWithPermissions.permissions || [])
      ];

      // Create a set of existing permission IDs for quick lookup
      const existingPermissionIds = new Set(existingPermissions.map(p => p.id));
      console.log('Service: Existing permission IDs:', Array.from(existingPermissionIds));

      // Check if any of the requested permissions already exist
      const duplicatePermissions = permissionIds.filter(id => existingPermissionIds.has(id));
      if (duplicatePermissions.length > 0) {
        console.log('Service: Found duplicate permissions:', duplicatePermissions);
        throw new ConflictException(`Permissions with IDs ${duplicatePermissions.join(', ')} already exist for this user (either in role or direct permissions)`);
      }

      // Verify all permissions exist in the database
      for (const permissionId of permissionIds) {
        const permission = await this.permissionRepository.findPermissionById(permissionId);
        console.log('Service: Checking permission:', permissionId, 'Result:', permission);
        
        if (!permission) {
          console.log('Service: Permission not found with ID:', permissionId);
          throw new NotFoundException(`Permission with ID ${permissionId} not found`);
        }
      }

      console.log('Service: Adding permissions to user');
      const result = await this.permissionRepository.addPermissionsToUser(userId, permissionIds);
      console.log('Service: Permissions added successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Service: Error in addPermissionsToUser:', error);
      throw error;
    }
  }

  async removePermissionsFromUser(userId: number, permissionIds: number[]): Promise<PermissionResType[]> {
    try {
      console.log('Service: Starting remove permissions from user. UserId:', userId, 'PermissionIds:', permissionIds);

      // Check if user exists
      const user = await this.authRepository.findUserById(userId);
      console.log('Service: Found user:', user);
      
      if (!user) {
        console.log('Service: User not found with ID:', userId);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Verify all permissions exist
      for (const permissionId of permissionIds) {
        const permission = await this.permissionRepository.findPermissionById(permissionId);
        console.log('Service: Checking permission:', permissionId, 'Result:', permission);
        
        if (!permission) {
          console.log('Service: Permission not found with ID:', permissionId);
          throw new NotFoundException(`Permission with ID ${permissionId} not found`);
        }
      }

      console.log('Service: Removing permissions from user');
      const result = await this.permissionRepository.removePermissionsFromUser(userId, permissionIds);
      console.log('Service: Permissions removed successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Service: Error in removePermissionsFromUser:', error);
      throw error;
    }
  }
}
