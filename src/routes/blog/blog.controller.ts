import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common'
import { BlogService } from './blog.service'
import { CreateBlogDto, CreateBlogDtoType, UpdateBlogDto, UpdateBlogDtoType, BlogResponseType } from './blog.dto'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import CustomZodValidationPipe from 'src/common/custom-zod-validate'
import { ApiCreateBlog, ApiDeleteBlog, ApiGetAllBlogs, ApiGetBlogById, ApiUpdateBlog } from 'src/swagger/blog.swagger'

@ApiTags('Blogs')
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // @ApiBearerAuth()
  @ApiCreateBlog()
  @Post()
  async createBlog(
    @Body(new CustomZodValidationPipe(CreateBlogDto))
    data: CreateBlogDtoType,
  ): Promise<BlogResponseType> {
    return this.blogService.createBlog(data)
  }

  @ApiGetAllBlogs()
  @Get()
  async findAllBlogs(): Promise<BlogResponseType[]> {
    console.log('hello')
    return this.blogService.findAllBlogs()
  }

  @ApiGetBlogById()
  @Get(':id')
  async findBlogById(@Param('id', ParseIntPipe) id: number): Promise<BlogResponseType> {
    return this.blogService.findBlogById(id)
  }

  @ApiBearerAuth()
  @ApiUpdateBlog()
  @Patch(':id')
  async updateBlog(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateBlogDto))
    data: UpdateBlogDtoType,
  ): Promise<BlogResponseType> {
    return this.blogService.updateBlog(id, data)
  }

  @ApiBearerAuth()
  @ApiDeleteBlog()
  @Delete(':id')
  async removeBlog(@Param('id', ParseIntPipe) id: number): Promise<BlogResponseType> {
    return this.blogService.removeBlog(id)
  }
}
