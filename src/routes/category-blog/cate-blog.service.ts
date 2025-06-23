import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CateBlogResponseType, CreateCateBlogDto, UpdateCateBlogDto } from './cate-blog.dto'
import { CateBlogRepository } from 'src/repositories/cate-blog.repository'
import { PaginatedResponse } from 'src/shared/schemas/pagination.schema'
import { PaginationService } from 'src/shared/services/pagination.service'

@Injectable()
export class CateBlogService {
  constructor(
    private readonly cateBlogRepository: CateBlogRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createCateBlog(data: CreateCateBlogDto): Promise<CateBlogResponseType> {
    const exitedBlog = await this.cateBlogRepository.findCateBlogsPaginated({
      page: 1,
      limit: 1,
      sortOrder: 'desc',
      search: data.title,
      searchFields: ['title'],
    })
    if (exitedBlog.data.length > 0) throw new BadRequestException('Category blog already exists')
    return await this.cateBlogRepository.createCateBlog(data)
  }

  async findAllCateBlogs(query: unknown): Promise<PaginatedResponse<CateBlogResponseType>> {
    const options = this.paginationService.getPaginationOptions(query)

    return await this.cateBlogRepository.findCateBlogsPaginated(options)
  }

  async searchCateBlogs(query: string): Promise<CateBlogResponseType[]> {
    return await this.cateBlogRepository.searchCateBlogs(query)
  }

  async findCateBlogById(id: number): Promise<CateBlogResponseType> {
    const cate = await this.cateBlogRepository.findCateBlogById(id)
    if (!cate) throw new NotFoundException('Category blog not found')
    return cate
  }

  async updateCateBlog(id: number, dto: UpdateCateBlogDto): Promise<CateBlogResponseType> {
    const cate = await this.cateBlogRepository.findCateBlogById(id)
    if (!cate) throw new NotFoundException('Category blog not found')
    return await this.cateBlogRepository.updateCateBlog(id, dto)
  }

  async remove(id: number): Promise<CateBlogResponseType> {
    const cate = await this.cateBlogRepository.findCateBlogById(id)
    if (!cate) throw new NotFoundException('Category blog not found')
    return await this.cateBlogRepository.removeCateBlog(id)
  }

  async changeStatus(id: number, isPublished: boolean) {
    const cate = await this.cateBlogRepository.findCateBlogById(id)
    if (!cate) throw new NotFoundException('Category blog not found')
    return await this.cateBlogRepository.changeStatus(id, isPublished)
  }
}
