import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Medicine } from '@prisma/client'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { Auth } from '../../shared/decorators/auth.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import {
  ApiBulkCreateMedicines,
  ApiCreateMedicine,
  ApiDeleteMedicine,
  ApiGetAllMedicines,
  ApiGetMedicineById,
  ApiGetMedicineStats,
  ApiGetPriceDistribution,
  ApiGetUnitUsage,
  ApiSearchMedicines,
  ApiUpdateMedicine,
} from '../../swagger/medicine.swagger'
import {
  AdvancedSearchDto,
  BulkCreateMedicineDto,
  CreateMedicineDto,
  MedicineStatsQueryDto,
  PriceDistributionQueryDto,
  QueryMedicineDto,
  UnitUsageQueryDto,
  UpdateMedicineDto,
} from './medicine.dto'
import { MedicineService } from './medicine.service'

@ApiBearerAuth()
@ApiTags('Medicine Management')
@Controller('medicines')
@Auth([AuthType.Bearer])
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreateMedicine()
  async createMedicine(@Body() body: unknown): Promise<Medicine> {
    const validatedData = CreateMedicineDto.create(body)
    return this.medicineService.createMedicine(validatedData)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor)
  @ApiGetAllMedicines()
  async getAllMedicines(@Query() query: unknown): Promise<PaginatedResponse<Medicine>> {
    const validatedQuery = QueryMedicineDto.create(query)
    return this.medicineService.getAllMedicines(validatedQuery)
  }

  @Get('search')
  @Roles(Role.Admin, Role.Doctor)
  @ApiSearchMedicines()
  async searchMedicines(@Query('q') query: string): Promise<Medicine[]> {
    return this.medicineService.searchMedicines(query)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetMedicineById()
  async getMedicineById(@Param('id', ParseIntPipe) id: number): Promise<Medicine> {
    return this.medicineService.getMedicineById(id)
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdateMedicine()
  async updateMedicine(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<Medicine> {
    const validatedData = UpdateMedicineDto.create(body)
    return this.medicineService.updateMedicine(id, validatedData)
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiDeleteMedicine()
  async deleteMedicine(@Param('id', ParseIntPipe) id: number): Promise<Medicine> {
    return this.medicineService.deleteMedicine(id)
  }

  @Get('price-range')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Get medicines by price range',
    description:
      'Filter medicines within a specified price range. Useful for budget-based medicine selection and cost analysis.',
  })
  @ApiQuery({
    name: 'minPrice',
    required: true,
    type: Number,
    description: 'Minimum price threshold for filtering medicines',
    example: 50000,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: true,
    type: Number,
    description: 'Maximum price threshold for filtering medicines',
    example: 200000,
  })
  async getMedicinesByPriceRange(
    @Query('minPrice') minPrice: string,
    @Query('maxPrice') maxPrice: string,
  ): Promise<Medicine[]> {
    const minPriceNum = parseFloat(minPrice)
    const maxPriceNum = parseFloat(maxPrice)

    if (isNaN(minPriceNum) || isNaN(maxPriceNum)) {
      throw new Error('Invalid price values provided')
    }

    return this.medicineService.getMedicinesByPriceRange(minPriceNum, maxPriceNum)
  }

  @Get('advanced-search')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Advanced search for medicines',
    description:
      'Perform advanced search with multiple criteria including name, price range, unit type, and pagination. Provides comprehensive filtering capabilities for medicine discovery.',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Search term for medicine name or description',
    example: 'Paracetamol',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price for filtering',
    example: 10000,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price for filtering',
    example: 100000,
  })
  @ApiQuery({
    name: 'unit',
    required: false,
    type: String,
    description: 'Filter by medicine unit (e.g., mg, ml, tablet)',
    example: 'mg',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results per page', example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination', example: 1 })
  async advancedSearchMedicines(@Query() query: unknown) {
    const validatedQuery = AdvancedSearchDto.create(query)
    return this.medicineService.advancedSearchMedicines(validatedQuery)
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.Doctor)
  @ApiBulkCreateMedicines()
  async createManyMedicines(@Body() body: unknown) {
    const validatedData = BulkCreateMedicineDto.create(body)
    return this.medicineService.createManyMedicines(validatedData.medicines, validatedData.skipDuplicates || false)
  }

  @Get('analytics/stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetMedicineStats()
  async getMedicineStats() {
    return this.medicineService.getMedicineUsageStats()
  }
}
