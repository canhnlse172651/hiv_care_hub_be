import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreateRoleType, UpdateRoleType, RoleResType, QueryRoleType, UpdateUserRolesType } from '../routes/role/role.model'
import { Prisma } from '@prisma/client'

@Injectable()
export class RoleRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // Add method to get Prisma role model
  getRoleModel() {
    return this.prismaService.role;
  }

  async createRole(data: CreateRoleType): Promise<RoleResType> {
    try {
      return await this.prismaService.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: {
          connect: data.permissions.map(id => ({ id }))
        },
          createdById: data.createdById,
          isActive: data.isActive ?? true
      },
      include: {
        permissions: true
      }
    })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Role name already exists')
        }
      }
      throw error
    }
  }

  async findRoleById(id: number): Promise<RoleResType | null> {
    try {
      return this.prismaService.role.findUnique({
        where: { 
          id,
          deletedAt: null 
        },
        include: {
          permissions: true
        }
      })
    } catch (error) {
      console.error('Error in findRoleById:', error)
      throw error
    }
  }

  async findRoleByName(name: string): Promise<RoleResType | null> {
    return this.prismaService.role.findUnique({
      where: { name },
      include: {
        permissions: true
      }
    })
  }

  async updateRole(id: number, data: UpdateRoleType): Promise<RoleResType> {
    try {
      return await this.prismaService.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions ? {
          set: data.permissions.map(id => ({ id }))
        } : undefined,
          updatedById: data.updatedById,
          isActive: data.isActive
      },
      include: {
        permissions: true
      }
    })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Role name already exists')
        }
      }
      throw error
    }
  }

  async deleteRole(id: number): Promise<RoleResType> {
    return this.prismaService.role.update({
      where: { id },
      data: {
        deletedAt: new Date()
      },
      include: {
        permissions: true
      }
    })
  }

  async getAllRoles(query?: QueryRoleType): Promise<RoleResType[]> {
    return this.prismaService.role.findMany({
      where: {
        deletedAt: null
      },
      include: {
        permissions: true
      }
    })
  }

  async getUserRoles(userId: number): Promise<RoleResType[]> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    })

    return user?.role ? [user.role] : []
  }

  async addRolesToUser(userId: number, roleIds: number[]): Promise<RoleResType[]> {
    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        roleId: roleIds[0]
      },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    })

    return user.role ? [user.role] : []
  }

  async removeRolesFromUser(userId: number, roleIds: number[]): Promise<RoleResType[]> {
    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        roleId: undefined
      },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    })

    return user.role ? [user.role] : []
  }

  async getUserRole(userId: number): Promise<RoleResType | null> {
    try {
      console.log('Repository userId:', userId, typeof userId); // Debug log
      const user = await this.prismaService.user.findFirst({
        where: { 
          id: userId,
          deletedAt: null 
        },
        include: {
          role: {
            include: {
              permissions: true
            }
          },
          permissions: true // Include direct user permissions
        }
      })

      console.log('Found user:', user); // Debug log

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`)
      }

      if (!user.role) {
        return null;
      }

      // Log role permissions
      console.log('Role permissions:', user.role.permissions.map(p => ({
        id: p.id,
        name: p.name,
        path: p.path,
        method: p.method
      })));

      // Log direct user permissions
      console.log('Direct user permissions:', user.permissions.map(p => ({
        id: p.id,
        name: p.name,
        path: p.path,
        method: p.method
      })));

      // Combine role permissions with direct user permissions
      const allPermissions = [...user.role.permissions, ...user.permissions];
      
      // Remove duplicates based on permission id
      const uniquePermissions = Array.from(
        new Map(allPermissions.map(p => [p.id, p])).values()
      );

      // Log final unique permissions
      console.log('Final unique permissions:', uniquePermissions.map(p => ({
        id: p.id,
        name: p.name,
        path: p.path,
        method: p.method
      })));

      return {
        ...user.role,
        permissions: uniquePermissions
      };
    } catch (error) {
      console.error('Error in getUserRole repository:', error)
      throw error
    }
  }

  async updateUserRole(userId: number, roleId: number): Promise<RoleResType | null> {
    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        roleId
      },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    })

    return user.role || null
  }
} 