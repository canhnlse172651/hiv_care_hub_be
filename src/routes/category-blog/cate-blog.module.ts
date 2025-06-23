import { Module } from '@nestjs/common'
import { CateBlogController } from './cate-blog.controller'
import { CateBlogService } from './cate-blog.service'
import { CateBlogRepository } from '../../repositories/cate-blog.repository'
import { PrismaService } from '../../shared/services/prisma.service'

@Module({
  controllers: [CateBlogController],
  providers: [CateBlogService, CateBlogRepository, PrismaService],
  exports: [CateBlogService],
})
export class CateBlogModule {}
