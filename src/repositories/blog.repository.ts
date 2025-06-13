import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'
import { BlogResponseType, CreateBlogDtoType, UpdateBlogDtoType } from '../routes/blog/blog.dto'
import { slugify } from 'src/shared/utils/slugify.utils'

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  getBlogModel() {
    return this.prisma.blogPost
  }

  async createBlog(data: CreateBlogDtoType): Promise<BlogResponseType> {
    const slug = slugify(data.title)
    const blog = await this.prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        imageUrl: data.imageUrl,
        authorId: data.authorId,
        cateId: data.cateId,
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
        category: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    })

    const { category, ...rest } = blog
    return {
      ...rest,
      cateBlog: category,
    } as BlogResponseType
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
        category: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return blogs.map((blog) => {
      const { category, ...rest } = blog
      return {
        ...rest,
        cateBlog: category,
      } as BlogResponseType
    })
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
        category: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    })

    return blog
      ? ({
          ...blog,
          cateBlog: blog.category,
        } as BlogResponseType)
      : null
  }

  async updateBlog(id: number, data: UpdateBlogDtoType): Promise<BlogResponseType> {
    const updateData = {
      ...data,
      ...(data.title && { slug: slugify(data.title) }),
    }
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    })

    return {
      ...updated,
      cateBlog: updated.category,
    } as BlogResponseType
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
        category: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    })

    return {
      ...deleted,
      cateBlog: deleted.category,
    } as BlogResponseType
  }

  async changeStatusBlog(id: number, isPublished: boolean): Promise<BlogResponseType> {
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: { isPublished },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    })

    return {
      ...updated,
      cateBlog: updated.category,
    } as BlogResponseType
  }
}
