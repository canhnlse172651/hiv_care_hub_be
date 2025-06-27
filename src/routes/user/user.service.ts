import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common'
import { CreateUserDtoType, UpdateUserDtoType, UserResponseType} from './user.dto'
import { AuthRepository } from '../../repositories/user.repository'
import { Prisma } from '@prisma/client'
import { PaginationService } from '../../shared/services/pagination.service'
import { createPaginationSchema, PaginatedResponse } from '../../shared/schemas/pagination.schema'
import { generateRandomPassword } from 'src/shared/utils/password.utils'
import { QueryUserSchema } from './user.model'
import { EmailService } from 'src/shared/services/email.service';
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: AuthRepository,
    private readonly paginationService: PaginationService,
    private readonly emailService: EmailService,
  ) {}

  async createUser(data: CreateUserDtoType): Promise<UserResponseType> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findUserByEmail(data.email)

    if (existingUser) {
      throw new ConflictException('Email already exists')
    }

    // Generate random password
    const password = generateRandomPassword()

    // Create user with generated password
    const user = await this.userRepository.createAccount({
      email: data.email,
      name: data.name,
      roleId: data.roleId,
      phoneNumber: data.phoneNumber,
      password,
    })

    // Send email with password
    await this.emailService.sendWelcomeEmail({
      email: user.email,
      name: user.name,
      password: password,
    })

    return user
  }

  async updateUser(id: number, data: UpdateUserDtoType): Promise<UserResponseType> {
    try {
      // Kiểm tra user tồn tại
      const existingUser = await this.userRepository.findUserById(id)
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`)
      }

      // Cập nhật user
      const updatedUser = await this.userRepository.updateUser(id, {
        name: data.name,
        phoneNumber: data.phoneNumber,
        avatar: data.avatar,
        status: data.status,
        roleId: data.roleId,
        updatedAt: new Date(),
      })

      return updatedUser as UserResponseType
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Email already exists')
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid role ID')
        }
      }
      throw new InternalServerErrorException('Failed to update user')
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      // Kiểm tra user tồn tại
      const existingUser = await this.userRepository.findUserById(id)
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`)
      }

      // Soft delete user
      await this.userRepository.deleteUser(id)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Failed to delete user')
    }
  }

  async getUserById(id: number): Promise<UserResponseType> {
    try {
      const user = await this.userRepository.findUserById(id)
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`)
      }
      if (user.deletedAt !== null) {
        throw new NotFoundException(`User with ID ${id} has been deleted`)
      }
      return user as UserResponseType
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Failed to get user')
    }
  }

  async getUsers(query: unknown): Promise<PaginatedResponse<UserResponseType>> {
    try {
      
      // Parse và validate query với pagination schema
      const paginationOptions = createPaginationSchema(QueryUserSchema).parse(query);
   
      
      // Khởi tạo where condition cơ bản
      const where: Prisma.UserWhereInput = {
      
      };
  
      // Xử lý filters
      if (paginationOptions.filters) {
      
        try {
          // Validate filters theo QueryUserSchema
          const validFilters = QueryUserSchema.parse(paginationOptions.filters);
        
          
          // Loại bỏ searchFields khỏi filters
          const { searchFields, ...filtersWithoutSearchFields } = validFilters;
          Object.assign(where, filtersWithoutSearchFields);
        } catch (filterError) {
          console.error('Filter validation error:', filterError);
          throw new BadRequestException('Invalid filters format');
        }
      }
  
      // Xử lý search
      if (paginationOptions.search) {
        where.OR = [
          { name: { contains: paginationOptions.search, mode: 'insensitive' } },
          { email: { contains: paginationOptions.search, mode: 'insensitive' } },
          { phoneNumber: { contains: paginationOptions.search, mode: 'insensitive' } }
        ];
      }
  
     
  
      // Loại bỏ searchFields trước khi gọi paginate
      const { searchFields, ...paginationOptionsWithoutSearchFields } = paginationOptions;
  
      return this.paginationService.paginate<UserResponseType>(
        this.userRepository.getUserModel(),
        paginationOptionsWithoutSearchFields,
        where,
        { role: true }
      );
    } catch (error) {
      console.error('Service: Error in getUsers:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get users');
    }
  }

  async getUserByEmail(email: string): Promise<UserResponseType | null> {
    try {
      return this.userRepository.findUserByEmail(email) as Promise<UserResponseType | null>
    } catch (error) {
      throw new InternalServerErrorException('Failed to get user by email')
    }
  }

  async getUsersByRoleId(roleId: number): Promise<UserResponseType[]> {
    try {
      const users = await this.userRepository.findUsersByRoleId(roleId)
      if (!users || users.length === 0) {
        throw new NotFoundException(`No users found with role ID ${roleId}`)
      }
      return users as UserResponseType[]
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Failed to get users by role ID')
    }
  }

  async restoreUser(id: number): Promise<UserResponseType> {
    try {
      // Kiểm tra user tồn tại (kể cả đã bị xóa)
      const existingUser = await this.userRepository.findUserById(id)

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`)
      }

      if (!existingUser.deletedAt) {
        throw new BadRequestException(`User with ID ${id} is not deleted`)
      }

      // Khôi phục user
      const restoredUser = await this.userRepository.restoreUser(id)
      return restoredUser as UserResponseType
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new InternalServerErrorException('Failed to restore user')
    }
  }
}
