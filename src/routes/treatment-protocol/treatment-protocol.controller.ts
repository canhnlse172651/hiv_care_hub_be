import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { TreatmentProtocol } from '@prisma/client'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { Auth } from '../../shared/decorators/auth.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import {
  ApiAdvancedSearchTreatmentProtocols,
  ApiBulkCreateTreatmentProtocols,
  ApiCloneTreatmentProtocol,
  ApiCreateCustomProtocolFromTreatment,
  ApiCreateTreatmentProtocol,
  ApiDeleteTreatmentProtocol,
  ApiFindTreatmentProtocolByName,
  ApiFindTreatmentProtocolsPaginated,
  ApiGetAllTreatmentProtocols,
  ApiGetMostPopularProtocols,
  ApiGetProtocolComparison,
  ApiGetProtocolEffectivenessMetrics,
  ApiGetProtocolsWithCustomVariations,
  ApiGetProtocolTrendAnalysis,
  ApiGetProtocolUsageStats,
  ApiGetTreatmentProtocolById,
  ApiSearchTreatmentProtocols,
  ApiUpdateTreatmentProtocol,
} from '../../swagger/treatment-protocol.swagger'
import {
  AdvancedSearchTreatmentProtocolDto,
  BulkCreateTreatmentProtocolDto,
  CloneTreatmentProtocolDto,
  CreateCustomProtocolFromTreatmentDto,
  CreateTreatmentProtocolDto,
  FindTreatmentProtocolByNameDto,
  PopularProtocolsQueryDto,
  ProtocolComparisonDto,
  ProtocolTrendAnalysisDto,
  UpdateTreatmentProtocolDto,
} from './treatment-protocol.dto'
import { TreatmentProtocolService } from './treatment-protocol.service'

@ApiBearerAuth()
@ApiTags('Treatment Protocol Management')
@Controller('treatment-protocols')
@Auth([AuthType.Bearer])
export class TreatmentProtocolController {
  constructor(private readonly treatmentProtocolService: TreatmentProtocolService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreateTreatmentProtocol()
  async createTreatmentProtocol(@Body() body: unknown, @CurrentUser() user: any): Promise<TreatmentProtocol> {
    const validatedData = CreateTreatmentProtocolDto.create(body)
    return this.treatmentProtocolService.createTreatmentProtocol(validatedData, Number(user.userId))
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetAllTreatmentProtocols()
  async getAllTreatmentProtocols(@Query() query: unknown): Promise<PaginatedResponse<TreatmentProtocol>> {
    return this.treatmentProtocolService.getAllTreatmentProtocols(query)
  }

  @Get('search')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiSearchTreatmentProtocols()
  async searchTreatmentProtocols(@Query('q') query: string): Promise<TreatmentProtocol[]> {
    return this.treatmentProtocolService.searchTreatmentProtocols(query)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentProtocolById()
  async getTreatmentProtocolById(@Param('id', ParseIntPipe) id: number): Promise<TreatmentProtocol> {
    return this.treatmentProtocolService.getTreatmentProtocolById(id)
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdateTreatmentProtocol()
  async updateTreatmentProtocol(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: any,
  ): Promise<TreatmentProtocol> {
    const validatedData = UpdateTreatmentProtocolDto.create(body)
    return this.treatmentProtocolService.updateTreatmentProtocol(id, validatedData, Number(user.userId))
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiDeleteTreatmentProtocol()
  async deleteTreatmentProtocol(@Param('id', ParseIntPipe) id: number): Promise<TreatmentProtocol> {
    return this.treatmentProtocolService.deleteTreatmentProtocol(id)
  }

  // ===============================
  // ADVANCED SEARCH AND FILTERING
  // ===============================

  @Get('advanced-search')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiAdvancedSearchTreatmentProtocols()
  async advancedSearchTreatmentProtocols(@Query() query: unknown) {
    const validatedQuery = AdvancedSearchTreatmentProtocolDto.create(query)
    return this.treatmentProtocolService.advancedSearchTreatmentProtocols(validatedQuery)
  }

  @Get('find-by-name')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiFindTreatmentProtocolByName()
  async findTreatmentProtocolByName(@Query() query: unknown): Promise<TreatmentProtocol | null> {
    const validatedQuery = FindTreatmentProtocolByNameDto.create(query)
    return this.treatmentProtocolService.findTreatmentProtocolByName(validatedQuery.name)
  }

  // ===============================
  // ANALYTICS AND STATISTICS
  // ===============================

  @Get('stats/usage/:id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetProtocolUsageStats()
  async getProtocolUsageStats(@Param('id', ParseIntPipe) id: number) {
    return this.treatmentProtocolService.getProtocolUsageStats(id)
  }

  @Get('stats/popular')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetMostPopularProtocols()
  async getMostPopularProtocols(@Query() query: unknown) {
    const validatedQuery = PopularProtocolsQueryDto.create(query)
    return this.treatmentProtocolService.getMostPopularProtocols(validatedQuery.limit)
  }

  @Get('stats/custom-variations')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetProtocolsWithCustomVariations()
  async getProtocolsWithCustomVariations() {
    return this.treatmentProtocolService.getProtocolsWithCustomVariations()
  }

  // ===============================
  // PROTOCOL MANAGEMENT
  // ===============================

  @Post('clone/:id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiCloneTreatmentProtocol()
  async cloneTreatmentProtocol(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: any,
  ): Promise<TreatmentProtocol> {
    const validatedBody = CloneTreatmentProtocolDto.create(body)
    return this.treatmentProtocolService.cloneTreatmentProtocol(id, validatedBody.newName, Number(user.userId))
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.Doctor)
  @ApiBulkCreateTreatmentProtocols()
  async bulkCreateTreatmentProtocols(@Body() body: unknown, @CurrentUser() user: any) {
    const validatedBody = BulkCreateTreatmentProtocolDto.create(body)
    return this.treatmentProtocolService.bulkCreateTreatmentProtocols(
      validatedBody.protocols,
      Number(user.userId),
      validatedBody.skipDuplicates,
    )
  }

  // ===============================
  // NEW ADVANCED ANALYTICS ENDPOINTS
  // ===============================

  @Get('analytics/effectiveness/:id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetProtocolEffectivenessMetrics()
  async getProtocolEffectivenessMetrics(@Param('id', ParseIntPipe) id: number) {
    return this.treatmentProtocolService.getProtocolEffectivenessMetrics(id)
  }

  @Post('analytics/comparison')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetProtocolComparison()
  async getProtocolComparison(@Body() body: unknown) {
    const validatedBody = ProtocolComparisonDto.create(body)
    return this.treatmentProtocolService.getProtocolComparison(validatedBody.protocolIds)
  }

  @Get('analytics/trends')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetProtocolTrendAnalysis()
  async getProtocolTrendAnalysis(@Query() query: unknown) {
    const validatedQuery = ProtocolTrendAnalysisDto.create(query)
    const params = {
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      disease: validatedQuery.disease,
      limit: validatedQuery.limit,
    }
    return this.treatmentProtocolService.getProtocolTrendAnalysis(params)
  }

  @Post('custom/from-treatment/:treatmentId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreateCustomProtocolFromTreatment()
  async createCustomProtocolFromTreatment(
    @Param('treatmentId', ParseIntPipe) treatmentId: number,
    @Body() body: unknown,
    @CurrentUser() user: any,
  ): Promise<TreatmentProtocol> {
    const validatedBody = CreateCustomProtocolFromTreatmentDto.create(body)
    return this.treatmentProtocolService.createCustomProtocolFromTreatment(
      treatmentId,
      validatedBody,
      Number(user.userId),
    )
  }

  @Get('paginated')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiFindTreatmentProtocolsPaginated()
  async findTreatmentProtocolsPaginated(@Query() query: unknown): Promise<PaginatedResponse<TreatmentProtocol>> {
    return this.treatmentProtocolService.findTreatmentProtocolsPaginated(query)
  }
}
