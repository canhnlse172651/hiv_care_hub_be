import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'
import { BlogResponseType, CreateBlogDtoType, UpdateBlogDtoType } from '../routes/blog/blog.dto'

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  getBlogModel() {
    return this.prisma.blogPost
  }

  async createBlog(data: CreateBlogDtoType): Promise<BlogResponseType> {
    const blog = await this.prisma.blogPost.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return blog as BlogResponseType
  }

  async findAllBlogs(): Promise<BlogResponseType[]> {
    const blogs = await this.prisma.blogPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return blogs as BlogResponseType[]
  }

  async findBlogById(id: number): Promise<BlogResponseType | null> {
    const blog = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return blog as BlogResponseType | null
  }

  async updateBlog(id: number, data: UpdateBlogDtoType): Promise<BlogResponseType> {
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return updated as BlogResponseType
  }

  async removeBlog(id: number): Promise<BlogResponseType> {
    const deleted = await this.prisma.blogPost.delete({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return deleted as BlogResponseType
  }
}
