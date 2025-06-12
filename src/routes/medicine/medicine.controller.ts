import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import CustomZodValidationPipe from '../../common/custom-zod-validate'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { ActiveUser } from '../../shared/decorators/active-user.decorator'
import { Auth } from '../../shared/decorators/auth.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import {
  ApiBulkUpdatePrices,
  ApiCreateMedicine,
  ApiDeleteMedicine,
  ApiGetAllMedicines,
  ApiGetMedicineById,
  ApiGetMedicineUsageStats,
  ApiRestoreMedicine,
  ApiSearchMedicines,
  ApiUpdateMedicine,
} from '../../swagger/medicine.swagger'
import {
  BulkUpdatePricesDto,
  BulkUpdatePricesDtoType,
  CreateMedicineDto,
  CreateMedicineDtoType,
  QueryMedicineDto,
  QueryMedicineDtoType,
  UpdateMedicineDto,
  UpdateMedicineDtoType,
} from './medicine.dto'
import { MedicineService } from './medicine.service'

@ApiTags('Medicines')
@ApiBearerAuth()
@Controller('medicines')
@Auth([AuthType.Bearer])
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiCreateMedicine()
  async createMedicine(
    @Body(new CustomZodValidationPipe(CreateMedicineDto)) data: CreateMedicineDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.medicineService.createMedicine(data, userId)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetAllMedicines()
  async getAllMedicines(@Query(new CustomZodValidationPipe(QueryMedicineDto)) query: QueryMedicineDtoType) {
    return await this.medicineService.getAllMedicines(query)
  }

  @Get('search/:searchTerm')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiSearchMedicines()
  async searchMedicines(@Param('searchTerm') searchTerm: string) {
    return await this.medicineService.searchMedicines(searchTerm)
  }

  @Get('price-range')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Get medicines by price range' })
  @ApiResponse({ status: 200, description: 'Medicines filtered by price range' })
  async getMedicinesByPriceRange(@Query('minPrice') minPrice?: string, @Query('maxPrice') maxPrice?: string) {
    const min = minPrice ? parseFloat(minPrice) : undefined
    const max = maxPrice ? parseFloat(maxPrice) : undefined
    return await this.medicineService.getMedicinesByPriceRange(min, max)
  }

  @Get('unit/:unit')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Get medicines by unit type' })
  @ApiResponse({ status: 200, description: 'Medicines filtered by unit' })
  async getMedicinesByUnit(@Param('unit') unit: string) {
    return await this.medicineService.getMedicinesByUnit(unit)
  }

  @Get('most-used')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Get most frequently used medicines' })
  @ApiResponse({ status: 200, description: 'Most used medicines retrieved' })
  async getMostUsedMedicines(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 10
    return await this.medicineService.getMostUsedMedicines(limitNumber)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetMedicineById()
  async getMedicineById(@Param('id', ParseIntPipe) id: number) {
    return await this.medicineService.getMedicineById(id)
  }

  @Get(':id/usage-stats')
  @Roles(Role.Admin, Role.Doctor)
  @ApiGetMedicineUsageStats()
  async getMedicineUsageStats(@Param('id', ParseIntPipe) id: number) {
    return await this.medicineService.getMedicineUsageStats(id)
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdateMedicine()
  async updateMedicine(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateMedicineDto)) data: UpdateMedicineDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.medicineService.updateMedicine(id, data, userId)
  }

  @Patch('bulk-update-prices')
  @Roles(Role.Admin)
  @ApiBulkUpdatePrices()
  async bulkUpdatePrices(
    @Body(new CustomZodValidationPipe(BulkUpdatePricesDto)) data: BulkUpdatePricesDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.medicineService.bulkUpdatePrices(data, userId)
  }

  @Patch(':id/restore')
  @Roles(Role.Admin)
  @ApiRestoreMedicine()
  async restoreMedicine(@Param('id', ParseIntPipe) id: number) {
    return await this.medicineService.restoreMedicine(id)
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiDeleteMedicine()
  async deleteMedicine(@Param('id', ParseIntPipe) id: number) {
    return await this.medicineService.deleteMedicine(id)
  }
}
