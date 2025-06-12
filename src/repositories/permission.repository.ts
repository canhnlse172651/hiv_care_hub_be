import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreatePermissionType, UpdatePermissionType, QueryPermissionType, PermissionResType } from '../routes/permission/permission.model'
import { HTTPMethod } from '@prisma/client'
import { AuthRepository } from './user.repository'

@Injectable()
export class PermissionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authRepository: AuthRepository
  ) {}

  async createPermission(data: CreatePermissionType): Promise<PermissionResType> {
    return this.prisma.permission.create({
      data: {
        name: data.name || '',
        description: data.description || '',
        path: data.path,
        method: data.method,
        createdById: null,
        updatedById: null
      },
      include: {
        createdBy: true,
        updatedBy: true
      }
    })
  }

  async updatePermission(id: number, data: UpdatePermissionType): Promise<PermissionResType> {
    return this.prisma.permission.update({
      where: { id },
      data,
      include: {
        createdBy: true,
        updatedBy: true
      }
    })
  }

  async deletePermission(id: number): Promise<PermissionResType> {
    return this.prisma.permission.delete({
      where: { id },
      include: {
        createdBy: true,
        updatedBy: true
      }
    })
  }

  async findPermissionById(id: number): Promise<PermissionResType | null> {
    return this.prisma.permission.findUnique({
      where: { id },
      include: {
        createdBy: true,
        updatedBy: true
      }
    })
  }

  async findPermissionByPathAndMethod(path: string, method: HTTPMethod): Promise<PermissionResType | null> {
    return this.prisma.permission.findFirst({
      where: {
        path,
        method
      },
      include: {
        createdBy: true,
        updatedBy: true
      }
    })
  }

  async getAllPermissions(query?: QueryPermissionType): Promise<PermissionResType[]> {
    return this.prisma.permission.findMany({
      where: {
        name: query?.name ? { contains: query.name } : undefined,
        path: query?.path ? { contains: query.path } : undefined,
        method: query?.method
      },
      include: {
        createdBy: true,
        updatedBy: true
      }
    })
  }

  // New methods for user permissions
  async getUserPermissions(userId: number): Promise<PermissionResType[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          include: {
            createdBy: true,
            updatedBy: true
          }
        }
      }
    })

    return user?.permissions || []
  }

  async addPermissionsToUser(userId: number, permissionIds: number[]): Promise<PermissionResType[]> {
    // Check if user exists first
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: {
          connect: permissionIds.map(id => ({ id }))
        }
      },
      include: {
        permissions: {
          include: {
            createdBy: true,
            updatedBy: true
          }
        }
      }
    })

    return this.getUserPermissions(userId)
  }

  async removePermissionsFromUser(userId: number, permissionIds: number[]): Promise<PermissionResType[]> {
    // Check if user exists first
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: {
          disconnect: permissionIds.map(id => ({ id }))
        }
      }
    })

    return this.getUserPermissions(userId)
  }

  getPermissionModel() {
    return this.prisma.permission;
  }
} 