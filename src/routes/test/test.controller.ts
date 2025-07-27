import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { TestService } from './test.service'
import { CreateTestDto, UpdateTestDto } from './test.dto'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { Roles } from '../../shared/decorators/roles.decorator'
import { PermissionsGuard } from '../../shared/guards/permissions.guard'
import { ApiCreateTest, ApiGetTests, ApiGetTestById, ApiUpdateTest, ApiDeleteTest } from '../../swagger/test.swagger'
import { Role } from 'src/shared/constants/role.constant'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { TestQuery } from '../../shared/interfaces/query.interface'

@ApiBearerAuth()
@ApiTags('Tests')
@Controller('tests')
@UseGuards(RolesGuard, PermissionsGuard)
@Auth([AuthType.Bearer])
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreateTest()
  async createTest(@Body() createTestDto: CreateTestDto) {
    return await this.testService.createTest(createTestDto)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTests()
  async getTests(@Query() query: TestQuery) {
    return await this.testService.findTestsPaginated(query)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTestById()
  async getTestById(@Param('id', ParseIntPipe) id: number) {
    return await this.testService.getTestById(id)
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdateTest()
  async updateTest(@Param('id', ParseIntPipe) id: number, @Body() updateTestDto: UpdateTestDto) {
    return await this.testService.updateTest(id, updateTestDto)
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiDeleteTest()
  async deleteTest(@Param('id', ParseIntPipe) id: number) {
    return await this.testService.deleteTest(id)
  }
}
