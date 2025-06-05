import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { PrismaService } from '../../shared/services/prisma.service'
import { AuthRepository } from '../../repositories/user.repository'
import { PaginationService } from '../../shared/services/pagination.service'

@Module({
  controllers: [UserController],
  providers: [UserService, AuthRepository, PrismaService, PaginationService],
  exports: [UserService],
})
export class UserModule {}
