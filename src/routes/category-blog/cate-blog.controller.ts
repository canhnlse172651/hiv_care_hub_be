import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common'
import { CateBlogService } from './cate-blog.service'
import {
  CateBlogResponseType,
  CreateCateBlogDto,
  CreateCateBlogDtoType,
  UpdateCateBlogDto,
  UpdateCateBlogDtoType,
} from './cate-blog.dto'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import CustomZodValidationPipe from 'src/common/custom-zod-validate'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import {
  ApiChangeCateBlogStatus,
  ApiCreateCateBlog,
  ApiDeleteCateBlog,
  ApiGetAllCateBlogs,
  ApiGetCateBlogById,
  ApiUpdateCateBlog,
} from 'src/swagger/cate-blog.swagger'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { Role } from 'src/shared/constants/role.constant'

@ApiTags('Category Blogs')
@ApiBearerAuth()
@Controller('cate-blogs')
@Auth([AuthType.Bearer])
@Roles(Role.Admin)
export class CateBlogController {
  constructor(private readonly cateBlogService: CateBlogService) {}

  @ApiCreateCateBlog()
  @Post()
  async createCateBolg(
    @Body(new CustomZodValidationPipe(CreateCateBlogDto))
    data: CreateCateBlogDtoType,
  ): Promise<CateBlogResponseType> {
    return this.cateBlogService.createCateBlog(data)
  }

  @ApiGetAllCateBlogs()
  @Get()
  async findAllCateBlogs(): Promise<CateBlogResponseType[]> {
    return this.cateBlogService.findAllCateBlogs()
  }

  @ApiGetCateBlogById()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CateBlogResponseType> {
    return this.cateBlogService.findCateBlogById(id)
  }

  @ApiUpdateCateBlog()
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateCateBlogDto)) data: UpdateCateBlogDtoType,
  ): Promise<CateBlogResponseType> {
    return this.cateBlogService.updateCateBlog(id, data)
  }

  @ApiDeleteCateBlog()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<CateBlogResponseType> {
    return this.cateBlogService.remove(id)
  }

  @ApiChangeCateBlogStatus()
  @Patch(':id/change-status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isPublished') isPublished: boolean,
  ): Promise<CateBlogResponseType> {
    return this.cateBlogService.changeStatus(id, isPublished)
  }
}
