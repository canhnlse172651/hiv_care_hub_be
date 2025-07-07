import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'
import { RegisterBodyType, RegisterResType, UserType, UserWithPasswordType } from '../routes/auth/auth.model'
import { UserResponseType } from '../routes/user/user.dto'
import { PrismaService } from '../shared/services/prisma.service'
@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // Add method to get Prisma model for pagination
  getUserModel() {
    return this.prismaService.user
  }

  async createUser(
    user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> & { roleId: number },
  ): Promise<RegisterResType> {
    return this.prismaService.user.create({
      data: user,
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        roleId: true,
        status: true,
        avatar: true,
        createdById: true,
        updatedById: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<RegisterResType>
  }

  async createUserInclueRole(
    user: Pick<UserType, 'email' | 'name' | 'password' | 'phoneNumber' | 'avatar' | 'roleId'>,
  ): Promise<
    UserType & { role: { name: string; id: number; description: string; isActive: boolean; permissions: any[] } }
  > {
    return this.prismaService.user.create({
      data: user,
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    }) as Promise<
      UserType & { role: { name: string; id: number; description: string; isActive: boolean; permissions: any[] } }
    >
  }

  async findUserByEmail(email: string): Promise<UserWithPasswordType | null> {
    return this.prismaService.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        phoneNumber: true,
        roleId: true,
        status: true,
        avatar: true,
        totpSecret: true,
        createdById: true,
        updatedById: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    }) as Promise<UserWithPasswordType | null>
  }

  async findUserById(id: number): Promise<UserResponseType | null> {
    return this.prismaService.user.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        roleId: true,
        status: true,
        avatar: true,
        totpSecret: true,
        createdById: true,
        updatedById: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<UserResponseType | null>
  }

  async findUserByIdWithDoctorId(id: number): Promise<(UserResponseType & { doctorId?: number }) | null> {
    const user = (await this.prismaService.user.findFirst({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        roleId: true,
        status: true,
        avatar: true,
        totpSecret: true,
        createdById: true,
        updatedById: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        doctor: {
          select: {
            id: true,
          },
        },
      },
    })) as (UserResponseType & { doctor?: { id: number } }) | null

    if (!user) return null

    const { doctor, ...rest } = user
    return {
      ...rest,
      doctorId: doctor?.id,
    }
  }

  async createRefreshToken(data: { token: string; userId: number; expiresAt: Date }) {
    try {
      // Delete all existing tokens for this user
      await this.prismaService.refreshToken.deleteMany({
        where: { userId: data.userId },
      })

      const result = await this.prismaService.refreshToken.create({
        data,
      })

      return result
    } catch (error) {
      console.error('Error creating refresh token:', error)
      throw error
    }
  }

  async findRefreshToken(token: string) {
    try {
      const result = await this.prismaService.refreshToken.findUnique({
        where: { token },
      })

      return result
    } catch (error) {
      console.error('Error finding refresh token:', error)
      throw error
    }
  }

  async deleteRefreshToken(token: string) {
    console.log('Deleting refresh token from DB. Token length:', token.length)
    try {
      const result = await this.prismaService.refreshToken.delete({
        where: { token },
      })

      return result
    } catch (error) {
      console.error('Error deleting refresh token:', error)
      throw error
    }
  }

  async updateUserRole(userId: number, roleId: number | undefined) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { roleId },
    })
  }

  async findUsersByRoleId(roleId: number) {
    try {
      console.log('Repository: Finding users with role ID:', roleId)
      const users = await this.prismaService.user.findMany({
        where: {
          roleId: roleId,
          deletedAt: null,
        },
      })
      console.log('Repository: Found users:', users)
      return users
    } catch (error) {
      console.error('Repository: Error in findUsersByRoleId:', error)
      throw error
    }
  }

  async createAccount(data: {
    email: string
    name?: string
    roleId: number
    phoneNumber?: string
    password: string
  }): Promise<UserResponseType> {
    return this.prismaService.user.create({
      data: {
        email: data.email,
        name: data.name || '',
        roleId: data.roleId,
        phoneNumber: data.phoneNumber || '',
        password: data.password,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        roleId: true,
        status: true,
        avatar: true,
        totpSecret: true,
        createdById: true,
        updatedById: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<UserResponseType>
  }

  async deleteUser(id: number): Promise<UserResponseType> {
    return this.prismaService.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        roleId: true,
        status: true,
        avatar: true,
        totpSecret: true,
        createdById: true,
        updatedById: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<UserResponseType>
  }

  async restoreUser(id: number): Promise<UserResponseType> {
    return this.prismaService.user.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        roleId: true,
        status: true,
        avatar: true,
        totpSecret: true,
        createdById: true,
        updatedById: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<UserResponseType>
  }

  async updateUser(id: number, data: Partial<User>): Promise<UserResponseType> {
    return this.prismaService.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        roleId: true,
        status: true,
        avatar: true,
        totpSecret: true,
        createdById: true,
        updatedById: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<UserResponseType>
  }

  async createVerificationCode(data: {
    email: string
    code: string
    type: 'FORGOT_PASSWORD' | 'REGISTER' | 'DISABLE_2FA' | 'LOGIN'
    expiresAt: Date
  }) {
    return this.prismaService.verificationCode.upsert({
      where: {
        email_type: {
          email: data.email,
          type: data.type,
        },
      },
      create: {
        email: data.email,
        code: data.code,
        type: data.type,
        expiresAt: data.expiresAt,
      },
      update: {
        code: data.code,
        expiresAt: data.expiresAt,
      },
    })
  }

  async findVerificationCode(uniqueValue: {
    email: string
    type: 'FORGOT_PASSWORD' | 'REGISTER' | 'DISABLE_2FA' | 'LOGIN'
    code?: string
  }) {
    return this.prismaService.verificationCode.findFirst({
      where: uniqueValue,
    })
  }

  async deleteVerificationCode(uniqueValue: {
    email: string
    type: 'FORGOT_PASSWORD' | 'REGISTER' | 'DISABLE_2FA' | 'LOGIN'
    code?: string
  }) {
    return this.prismaService.verificationCode.deleteMany({
      where: uniqueValue,
    })
  }
}
