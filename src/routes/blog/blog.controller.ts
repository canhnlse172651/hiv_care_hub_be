import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common'
import { BlogService } from './blog.service'
import { CreateBlogDto, CreateBlogDtoType, UpdateBlogDto, UpdateBlogDtoType, BlogResponseType } from './blog.dto'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import CustomZodValidationPipe from 'src/common/custom-zod-validate'
import { ApiCreateBlog, ApiDeleteBlog, ApiGetAllBlogs, ApiGetBlogById, ApiUpdateBlog } from 'src/swagger/blog.swagger'
import { ApiChangeCateBlogStatus } from 'src/swagger/cate-blog.swagger'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { Role } from 'src/shared/constants/role.constant'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Blogs')
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @ApiBearerAuth()
  @ApiCreateBlog()
  @Auth([AuthType.Bearer])
  @Roles(Role.Admin)
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
    return this.blogService.findAllBlogs()
  }

  @ApiGetBlogById()
  @Get(':id')
  async findBlogById(@Param('id', ParseIntPipe) id: number): Promise<BlogResponseType> {
    return this.blogService.findBlogById(id)
  }

  @ApiBearerAuth()
  @ApiUpdateBlog()
  @Auth([AuthType.Bearer])
  @Roles(Role.Admin)
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
  @Auth([AuthType.Bearer])
  @Roles(Role.Admin)
  @Delete(':id')
  async removeBlog(@Param('id', ParseIntPipe) id: number): Promise<BlogResponseType> {
    return this.blogService.removeBlog(id)
  }

  @ApiBearerAuth()
  @ApiChangeCateBlogStatus()
  @Auth([AuthType.Bearer])
  @Roles(Role.Admin)
  @Patch(':id/change-status')
  async changeStatusBlog(
    @Param('id', ParseIntPipe) id: number,
    @Body('isPublished') isPublished: boolean,
  ): Promise<BlogResponseType> {
    return this.blogService.changeStatusBlog(id, isPublished)
  }
}
