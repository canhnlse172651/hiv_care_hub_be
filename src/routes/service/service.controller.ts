import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, Query } from '@nestjs/common'
import { ServiceService } from './service.service'
import {
  CreateServiceDto,
  CreateServiceDtoType,
  UpdateServiceDto,
  UpdateServiceDtoType,
  ServiceResponseType,
} from './service.dto'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import {
  ApiCreateService,
  ApiGetAllServices,
  ApiGetAllActiveServices,
  ApiGetServiceById,
  ApiGetServiceBySlug,
  ApiUpdateService,
  ApiDeleteService,
} from 'src/swagger/service.swagger'
import CustomZodValidationPipe from 'src/common/custom-zod-validate'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { Role } from 'src/shared/constants/role.constant'
import { AuthType } from 'src/shared/constants/auth.constant'
import { QueryServiceSchema } from './service.query'
import { PaginatedResponse } from 'src/shared/schemas/pagination.schema'

@ApiTags('Services')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @ApiBearerAuth()
  @Auth([AuthType.Bearer])
  @Roles(Role.Admin)
  @ApiCreateService()
  @Post()
  async createService(
    @Body(new CustomZodValidationPipe(CreateServiceDto))
    data: CreateServiceDtoType,
  ): Promise<ServiceResponseType> {
    const result = await this.serviceService.createService(data)
    return {
      ...result,
      type: result.type,
    }
  }

  @ApiGetAllActiveServices()
  @Get('public')
  async getAllActiveServicesBySlug(@Query() query: any): Promise<PaginatedResponse<ServiceResponseType>> {
    return this.serviceService.findAllActiveServicesBySlug(query)
  }

  @ApiBearerAuth()
  @Auth([AuthType.Bearer])
  @Roles(Role.Admin)
  @ApiGetAllServices()
  @Get()
  async findAllServices(@Query() query: any): Promise<PaginatedResponse<ServiceResponseType>> {
    const result = await this.serviceService.findAllServices(query)
    return {
      ...result,
      data: result.data.map((service) => ({
        ...service,
        duration: service.duration ?? '',
      })),
    }
  }

  @ApiGetServiceById()
  @Get(':id')
  async findServiceById(@Param('id', ParseIntPipe) id: number): Promise<ServiceResponseType> {
    const service = await this.serviceService.findServiceById(id)
    return {
      ...service,
      type: service.type,
      duration: service.duration ?? '',
    }
  }

  @ApiGetServiceBySlug()
  @Get('slug/:slug')
  async findServiceBySlug(@Param('slug') slug: string): Promise<ServiceResponseType> {
    const service = await this.serviceService.findServiceBySlug(slug)
    return {
      ...service,
      type: service.type,
    }
  }

  @ApiBearerAuth()
  @Auth([AuthType.Bearer])
  @Roles(Role.Admin)
  @ApiUpdateService()
  @Patch(':id')
  async updateService(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateServiceDto))
    data: UpdateServiceDtoType,
  ): Promise<ServiceResponseType> {
    const result = await this.serviceService.updateService(id, data)
    return {
      ...result,
      type: result.type,
    }
  }

  @ApiBearerAuth()
  @Auth([AuthType.Bearer])
  @Roles(Role.Admin)
  @ApiDeleteService()
  @Delete(':id')
  async removeService(@Param('id', ParseIntPipe) id: number): Promise<ServiceResponseType> {
    const result = await this.serviceService.removeService(id)
    return {
      ...result,
      type: result.type,
    }
  }

  @ApiBearerAuth()
  @Auth([AuthType.Bearer])
  @Roles(Role.Admin)
  @ApiGetAllServices()
  @Get()
  async searchServices(@Query() query: any): Promise<PaginatedResponse<ServiceResponseType>> {
    return this.serviceService.searchServices(query)
  }
}
