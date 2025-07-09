import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
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
  @ApiBody({
    type: CreateMedicineDto,
    examples: {
      default: {
        summary: 'Example body',
        value: {
          name: 'Paracetamol',
          price: 15000,
          unit: 'mg',
          description: 'Pain reliever and fever reducer',
          stock: 1000,
        },
      },
    },
  })
  async createMedicine(
    @Body(new CustomZodValidationPipe(CreateMedicineDto)) body: CreateMedicineDtoType,
  ): Promise<Medicine> {
    return this.medicineService.createMedicine(body)
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.Doctor)
  @ApiBulkCreateMedicines()
  @ApiBody({
    type: BulkCreateMedicineDto,
    examples: {
      default: {
        summary: 'Bulk create example',
        value: {
          medicines: [
            { name: 'Paracetamol', price: 15000, unit: 'mg', description: 'Pain reliever', stock: 1000 },
            { name: 'Ibuprofen', price: 20000, unit: 'mg', description: 'Anti-inflammatory', stock: 500 },
          ],
          skipDuplicates: true,
        },
      },
    },
  })
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
    @Query(new ZodValidationPipe(PriceRangeSchema))
    dto: PriceRange,
  ): Promise<Medicine[]> {
    return this.medicineService.getMedicinesByPriceRange(dto.minPrice, dto.maxPrice)
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
  async advancedSearchMedicines(
    @Query(new ZodValidationPipe(AdvancedSearchSchema))
    dto: AdvancedSearch,
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
