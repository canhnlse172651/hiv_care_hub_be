import { Injectable, NotFoundException } from '@nestjs/common'
import { BlogRepository } from '../../repositories/blog.repository'
import { BlogResponseType, CreateBlogDtoType, UpdateBlogDtoType } from './blog.dto'
import { PaginationService } from 'src/shared/services/pagination.service'
import { PaginatedResponse } from 'src/shared/schemas/pagination.schema'

@Injectable()
export class BlogService {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createBlog(data: CreateBlogDtoType): Promise<BlogResponseType> {
    return await this.blogRepository.createBlog(data)
  }

  async findAllBlogs(query: unknown): Promise<PaginatedResponse<BlogResponseType>> {
    const options = this.paginationService.getPaginationOptions(query)

    return await this.blogRepository.findAllBlogs(options)
  }

  async searchBlogs(query: string): Promise<BlogResponseType[]> {
    return await this.blogRepository.searchBlogs(query)
  }

  async findBlogById(id: number): Promise<BlogResponseType> {
    const blog = await this.blogRepository.findBlogById(id)
    if (!blog) throw new NotFoundException('Blog not found')
    return blog
  }

  async findBlogBySlug(slug: string): Promise<BlogResponseType> {
    const blog = await this.blogRepository.findBlogBySlug(slug)
    if (!blog) throw new NotFoundException('Blog not found')
    return blog
  }

  async updateBlog(id: number, updateBlogDto: UpdateBlogDtoType): Promise<BlogResponseType> {
    const blog = await this.findBlogById(id)
    if (!blog) throw new NotFoundException('Blog not found')
    return await this.blogRepository.updateBlog(id, updateBlogDto)
  }

  async removeBlog(id: number): Promise<BlogResponseType> {
    const blog = await this.findBlogById(id)
    if (!blog) throw new NotFoundException('Blog not found')
    return await this.blogRepository.removeBlog(id)
  }

  async changeStatusBlog(id: number, isPublished: boolean): Promise<BlogResponseType> {
    const blog = await this.findBlogById(id)
    if (!blog) throw new NotFoundException('Blog not found')
    return await this.blogRepository.changeStatusBlog(id, isPublished)
  }
}
