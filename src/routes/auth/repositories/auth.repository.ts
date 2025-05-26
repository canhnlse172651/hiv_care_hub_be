import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RegisterBodyType, RegisterResType, UserType } from '../auth.model'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(user: Omit<RegisterBodyType, 'confirmPassword'> & { roleId: number }): Promise<RegisterResType> {
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
    })
  }

  async findUserByEmail(email: string): Promise<UserType | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    })
  }

  async findUserById(id: number): Promise<UserType | null> {
    return this.prismaService.user.findUnique({
      where: { id },
    })
  }

  async createRefreshToken(data: { token: string; userId: number; expiresAt: Date }) {
    return this.prismaService.refreshToken.create({
      data,
    })
  }

  async findRefreshToken(token: string) {
    return this.prismaService.refreshToken.findUnique({
      where: { token },
    })
  }

  async deleteRefreshToken(token: string) {
    return this.prismaService.refreshToken.delete({
      where: { token },
    })
  }
} 