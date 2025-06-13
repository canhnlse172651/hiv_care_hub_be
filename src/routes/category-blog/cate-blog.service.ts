import { Injectable, NotFoundException } from '@nestjs/common'
import { CateBlogResponseType, CreateCateBlogDto, UpdateCateBlogDto } from './cate-blog.dto'
import { CateBlogRepository } from 'src/repositories/cate-blog.repository'

@Injectable()
export class CateBlogService {
  constructor(private readonly cateBlogRepository: CateBlogRepository) {}

  async createCateBlog(data: CreateCateBlogDto): Promise<CateBlogResponseType> {
    return await this.cateBlogRepository.createCateBlog(data)
  }

  async findAllCateBlogs(): Promise<CateBlogResponseType[]> {
    return await this.cateBlogRepository.findAllCateBlogs()
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
