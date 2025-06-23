import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'
import { BlogResponseType, CreateBlogDtoType, UpdateBlogDtoType } from '../routes/blog/blog.dto'
import { randomSuffix, slugify } from 'src/shared/utils/slugify.utils'
import { PaginationService } from 'src/shared/services/pagination.service'
import { createPaginationSchema, PaginatedResponse, PaginationOptions } from 'src/shared/schemas/pagination.schema'
import { BlogFilterSchema, BlogSearchSchema } from 'src/routes/blog/blog.model'

@Injectable()
export class BlogRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  getBlogModel() {
    return this.prisma.blogPost
  }

  async createBlog(data: CreateBlogDtoType): Promise<BlogResponseType> {
    let slug = slugify(data.title)
    let exited = await this.findBlogBySlug(slug)
    while (exited) {
      slug = `${slugify(data.title)}-${randomSuffix()}`
      exited = await this.findBlogBySlug(slug)
    }
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

  async findAllBlogs(
    options: PaginationOptions<{ title?: string; description?: string }>,
  ): Promise<PaginatedResponse<any>> {
    const paginationSchema = createPaginationSchema(BlogFilterSchema)
    const validatedOptions = paginationSchema.parse({
      page: options.page?.toString() || '1',
      limit: options.limit?.toString() || '10',
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      searchFields: options.searchFields || ['title', 'description'],
      filters: options.filters ? JSON.stringify(options.filters) : undefined,
    })
    const where: any = {}
    if (validatedOptions.search) {
      where.title = { contains: validatedOptions.search, mode: 'insensitive' }
    }
    if (validatedOptions.filters) {
      if (validatedOptions.filters.title) {
        where.title = { contains: validatedOptions.filters.title, mode: 'insensitive' }
      }
      if (validatedOptions.filters.description) {
        where.description = { contains: validatedOptions.filters.description, mode: 'insensitive' }
      }
    }
    const orderBy: any = {}
    if (validatedOptions.sortBy && validatedOptions.sortOrder) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    return this.paginationService.paginate(this.prisma.blogPost, validatedOptions, where, {
      author: true,
      category: true,
    })
  }

  async searchBlogs(query: string): Promise<BlogResponseType[]> {
    const validatedParams = BlogSearchSchema.parse({ query })
    return this.prisma.blogPost.findMany({
      where: {
        title: {
          contains: validatedParams.query,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<BlogResponseType[]>
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

    if (!blog) return null
    const { category, ...rest } = blog
    return {
      ...rest,
      cateBlog: category,
    } as BlogResponseType
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

    const { category, ...rest } = updated
    return {
      ...rest,
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

    const { category, ...rest } = deleted

    return {
      ...rest,
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

    const { category, ...rest } = updated
    return {
      ...rest,
      cateBlog: category,
    } as BlogResponseType
  }

  async findBlogBySlug(slug: string): Promise<BlogResponseType | null> {
    const blog = await this.prisma.blogPost.findFirst({
      where: { slug },
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

    if (!blog) return null
    const { category, ...rest } = blog
    return {
      ...rest,
      cateBlog: category,
    } as BlogResponseType
  }
}
