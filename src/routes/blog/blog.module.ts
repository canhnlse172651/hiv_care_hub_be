import { Module } from '@nestjs/common'
import { BlogRepository } from '../../repositories/blog.repository'
import { PrismaService } from '../../shared/services/prisma.service'
import { BlogController } from './blog.controller'
import { BlogService } from './blog.service'

@Module({
  controllers: [BlogController],
  providers: [BlogService, BlogRepository, PrismaService],
})
export class BlogModule {}
