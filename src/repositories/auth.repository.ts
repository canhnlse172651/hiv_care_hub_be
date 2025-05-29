import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RegisterBodyType, RegisterResType, UserType } from '../routes/auth/auth.model'

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
      where: { id: id },
    })
  }

  async createRefreshToken(data: { token: string; userId: number; expiresAt: Date }) {
    console.log('Creating refresh token in DB:', {
      token: data.token,
      userId: data.userId,
      expiresAt: data.expiresAt
    });
    try {
      // Delete all existing tokens for this user
      await this.prismaService.refreshToken.deleteMany({
        where: { userId: data.userId }
      });
      console.log('Deleted old tokens for user:', data.userId);

      const result = await this.prismaService.refreshToken.create({
        data,
      });
      console.log('Successfully created refresh token:', {
        token: result.token,
        userId: result.userId,
        expiresAt: result.expiresAt
      });
      return result;
    } catch (error) {
      console.error('Error creating refresh token:', error);
      throw error;
    }
  }

  async findRefreshToken(token: string) {
    console.log('Finding refresh token in DB. Token length:', token.length);
    try {
      // First check if token exists
      const allTokens = await this.prismaService.refreshToken.findMany();
      console.log('All tokens in DB:', allTokens.map(t => ({ 
        token: t.token,
        userId: t.userId,
        expiresAt: t.expiresAt
      })));

      const result = await this.prismaService.refreshToken.findUnique({
        where: { token },
      });
      console.log('Found refresh token:', result ? {
        token: result.token,
        userId: result.userId,
        expiresAt: result.expiresAt
      } : null);
      return result;
    } catch (error) {
      console.error('Error finding refresh token:', error);
      throw error;
    }
  }

  async deleteRefreshToken(token: string) {
    console.log('Deleting refresh token from DB. Token length:', token.length);
    try {
      const result = await this.prismaService.refreshToken.delete({
        where: { token },
      });
      console.log('Successfully deleted refresh token:', {
        token: result.token.substring(0, 20) + '...',
        userId: result.userId,
        expiresAt: result.expiresAt
      });
      return result;
    } catch (error) {
      console.error('Error deleting refresh token:', error);
      throw error;
    }
  }

  async updateUserRole(userId: number, roleId: number | undefined) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { roleId }
    })
  }

  async findUsersByRoleId(roleId: number) {
    try {
      console.log('Repository: Finding users with role ID:', roleId);
      const users = await this.prismaService.user.findMany({
        where: {
          roleId: roleId,
          deletedAt: null
        }
      });
      console.log('Repository: Found users:', users);
      return users;
    } catch (error) {
      console.error('Repository: Error in findUsersByRoleId:', error);
      throw error;
    }
  }
} 