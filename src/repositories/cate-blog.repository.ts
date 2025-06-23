import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'
import {
  CateBlogResponseType,
  CreateCateBlogDtoType,
  UpdateCateBlogDtoType,
} from 'src/routes/category-blog/cate-blog.dto'
import { PaginationService } from 'src/shared/services/pagination.service'
import { CateBlogFilterSchema, CateBlogSearchSchema } from 'src/routes/category-blog/cate-blog.model'
import { createPaginationSchema, PaginatedResponse, PaginationOptions } from 'src/shared/schemas/pagination.schema'

@Injectable()
export class CateBlogRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  getModel() {
    return this.prisma.cateBlog
  }

  async createCateBlog(data: CreateCateBlogDtoType): Promise<CateBlogResponseType> {
    return (await this.prisma.cateBlog.create({ data })) as CateBlogResponseType
  }

  async findCateBlogsPaginated(
    options: PaginationOptions<{ title?: string; description?: string }>,
  ): Promise<PaginatedResponse<any>> {
    const paginationSchema = createPaginationSchema(CateBlogFilterSchema)
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
    if (validatedOptions.sortBy) {
      orderBy[validatedOptions.sortBy] = validatedOptions.sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }
    return this.paginationService.paginate(this.prisma.cateBlog, validatedOptions, where)
  }

  async searchCateBlogs(query: string): Promise<CateBlogResponseType[]> {
    const validatedParams = CateBlogSearchSchema.parse({ query })
    return this.prisma.cateBlog.findMany({
      where: {
        title: {
          contains: validatedParams.query,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<CateBlogResponseType[]>
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
