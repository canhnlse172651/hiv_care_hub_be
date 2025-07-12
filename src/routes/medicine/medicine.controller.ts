import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Medicine } from '@prisma/client'
import { ZodValidationPipe } from 'nestjs-zod'
import CustomZodValidationPipe from '../../common/custom-zod-validate'
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
  ApiSearchMedicines,
  ApiUpdateMedicine,
  ApiGetPriceRangeMedicines, // thêm dòng này
  ApiGetAdvancedSearchMedicines, // thêm dòng này
} from '../../swagger/medicine.swagger'
import { BulkCreateMedicineDto, CreateMedicineDto, UpdateMedicineDto, type CreateMedicineDtoType } from './medicine.dto'
import type { AdvancedSearch, BulkCreateMedicine, PriceRange, QueryMedicine, UpdateMedicine } from './medicine.model'
import { AdvancedSearchSchema, PriceRangeSchema } from './medicine.model'
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
  async createMedicine(
    @Body(new CustomZodValidationPipe(CreateMedicineDto)) body: CreateMedicineDtoType,
  ): Promise<Medicine> {
    return this.medicineService.createMedicine(body)
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.Doctor)
  @ApiBulkCreateMedicines()
  async createManyMedicines(@Body(new CustomZodValidationPipe(BulkCreateMedicineDto)) body: BulkCreateMedicine) {
    return this.medicineService.createManyMedicines(body.medicines, body.skipDuplicates || false)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor)
  @ApiGetAllMedicines()
  async getAllMedicines(@Query() query: QueryMedicine): Promise<PaginatedResponse<Medicine>> {
    const { QueryMedicineSchema } = await import('./medicine.model')
    const validatedQuery = QueryMedicineSchema.parse(query)
    console.log('Validated Query:', validatedQuery)
    return this.medicineService.getAllMedicines(validatedQuery)
  }

  @Get('search')
  @Roles(Role.Admin, Role.Doctor)
  @ApiSearchMedicines()
  async searchMedicines(@Query('q') query: string): Promise<Medicine[]> {
    return this.medicineService.searchMedicines(query)
  }

  @Get('price-range')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetPriceRangeMedicines()
  async getMedicinesByPriceRange(
    @Query(new ZodValidationPipe(PriceRangeSchema))
    dto: PriceRange,
  ): Promise<Medicine[]> {
    return this.medicineService.getMedicinesByPriceRange(dto.minPrice, dto.maxPrice)
  }

  @Get('advanced-search')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetAdvancedSearchMedicines()
  async advancedSearchMedicines(
    @Query(new ZodValidationPipe(AdvancedSearchSchema)) dto: AdvancedSearch,
  ): Promise<PaginatedResponse<Medicine>> {
    return this.medicineService.advancedSearchMedicines(dto)
  }

  @Get('analytics/stats')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetMedicineStats()
  async getMedicineStats() {
    return this.medicineService.getMedicineUsageStats()
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
  @ApiBody({
    type: UpdateMedicineDto,
    examples: {
      default: {
        summary: 'Update medicine example',
        value: {
          name: 'Paracetamol',
          price: 16000,
          unit: 'mg',
          description: 'Updated description',
          stock: 1200,
        },
      },
    },
  })
  async updateMedicine(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateMedicineDto)) body: UpdateMedicine,
  ): Promise<Medicine> {
    return this.medicineService.updateMedicine(id, body)
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiDeleteMedicine()
  async deleteMedicine(@Param('id', ParseIntPipe) id: number): Promise<Medicine> {
    return this.medicineService.deleteMedicine(id)
  }
}
