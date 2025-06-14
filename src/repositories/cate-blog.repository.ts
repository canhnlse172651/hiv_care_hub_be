import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'
import {
  CateBlogResponseType,
  CreateCateBlogDtoType,
  UpdateCateBlogDtoType,
} from 'src/routes/category-blog/cate-blog.dto'

@Injectable()
export class CateBlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCateBlog(data: CreateCateBlogDtoType): Promise<CateBlogResponseType> {
    return (await this.prisma.cateBlog.create({ data })) as CateBlogResponseType
  }

  async findAllCateBlogs(): Promise<CateBlogResponseType[]> {
    return (await this.prisma.cateBlog.findMany({ orderBy: { createdAt: 'desc' } })) as CateBlogResponseType[]
  }

  async findCateBlogById(id: number): Promise<CateBlogResponseType | null> {
    return (await this.prisma.cateBlog.findUnique({ where: { id } })) as CateBlogResponseType | null
  }

  async updateCateBlog(id: number, data: UpdateCateBlogDtoType): Promise<CateBlogResponseType> {
    return (await this.prisma.cateBlog.update({ where: { id }, data })) as CateBlogResponseType
  }

  async removeCateBlog(id: number): Promise<CateBlogResponseType> {
    return (await this.prisma.cateBlog.delete({ where: { id } })) as CateBlogResponseType
  }

  async changeStatus(id: number, isPublished: boolean): Promise<CateBlogResponseType> {
    return (await this.prisma.cateBlog.update({
      where: { id },
      data: { isPublished },
    })) as CateBlogResponseType
  }
}
