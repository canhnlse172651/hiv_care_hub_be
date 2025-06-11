import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { BlogRepository } from '../../repositories/blog.repository'
import { BlogResponseType, CreateBlogDtoType, UpdateBlogDtoType } from './blog.dto'
import { PaginationService } from 'src/shared/services/pagination.service'
import { createPaginationSchema, PaginatedResponse } from 'src/shared/schemas/pagination.schema'
import { QueryBlogSchema } from './blog.model'
import { Prisma } from '@prisma/client'

@Injectable()
export class BlogService {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createBlog(data: CreateBlogDtoType): Promise<BlogResponseType> {
    return await this.blogRepository.createBlog(data)
  }

  // async findAllBlogs(query: unknown): Promise<PaginatedResponse<BlogResponseType>> {
  //   try {
  //     // Validate and parse query parameters for pagination
  //     const paginationOptions = createPaginationSchema(QueryBlogSchema).parse(query)

  //     // Khởi tạo where condition cơ bản
  //     const where: Prisma.BlogPostWhereInput = {}

  //     //Xử lý filters
  //     if (paginationOptions.filters) {
  //       try {
  //         // Validate filters theo QueryBlogSchema
  //         const validFilters = QueryBlogSchema.parse(paginationOptions.filters)

  //         // Loại bỏ searchFields khỏi filters
  //         const { searchFields, ...filtersWithoutSearchFields } = validFilters
  //         Object.assign(where, filtersWithoutSearchFields)
  //       } catch (filterError) {
  //         console.log('Filter validation error:', filterError)
  //         throw new NotFoundException('Invalid filters format')
  //       }
  //     }

  //     // Xử lý search
  //     if (paginationOptions.search) {
  //       where.OR = [{ title: { contains: paginationOptions.search, mode: 'insensitive' } }]
  //     }

  //     // Loại bỏ searchFields trước khi gọi paginate
  //     const { searchFields, ...paginationOptionsWithoutSearchFields } = paginationOptions

  //     return this.paginationService.paginate<BlogResponseType>(
  //       this.blogRepository.getBlogModel(),
  //       paginationOptionsWithoutSearchFields,
  //       where,
  //       {
  //         include: {
  //           author: {
  //             select: {
  //               id: true,
  //               name: true,
  //               email: true,
  //               avatar: true,
  //             },
  //           },
  //         },
  //       },
  //     )
  //   } catch (error) {
  //     console.error('Error in findAllBlogs:', error)
  //     if (error instanceof BadRequestException) {
  //       throw error
  //     }
  //     throw new InternalServerErrorException('Failed to retrieve blogs')
  //   }
  // }
  async findAllBlogs(): Promise<BlogResponseType[]> {
    return await this.blogRepository.findAllBlogs()
  }

  async findBlogById(id: number): Promise<BlogResponseType> {
    const blog = await this.blogRepository.findBlogById(id)
    if (!blog) throw new NotFoundException('Blog not found')
    return blog
  }

  async updateBlog(id: number, updateBlogDto: UpdateBlogDtoType): Promise<BlogResponseType> {
    await this.findBlogById(id)
    return await this.blogRepository.updateBlog(id, updateBlogDto)
  }

  async removeBlog(id: number): Promise<BlogResponseType> {
    await this.findBlogById(id)
    return await this.blogRepository.removeBlog(id)
  }
}
