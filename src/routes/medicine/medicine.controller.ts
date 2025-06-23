import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Medicine } from '@prisma/client'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { Auth } from '../../shared/decorators/auth.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { PaginatedResponse } from '../../shared/schemas/pagination.schema'
import {
  ApiCreateMedicine,
  ApiDeleteMedicine,
  ApiGetAllMedicines,
  ApiGetMedicineById,
  ApiSearchMedicines,
  ApiUpdateMedicine,
} from '../../swagger/medicine.swagger'
import { CreateMedicineDto, UpdateMedicineDto } from './medicine.dto'
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
    return this.medicineService.getAllMedicines(query)
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
  async advancedSearchMedicines(@Query() query: Record<string, string>) {
    // Convert string parameters to appropriate types with proper type checking
    const params: {
      query?: string
      minPrice?: number
      maxPrice?: number
      unit?: string
      limit?: number
      page?: number
    } = {
      query: query.query,
      unit: query.unit,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      page: query.page ? parseInt(query.page, 10) : undefined,
    }

    return this.medicineService.advancedSearchMedicines(params)
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({
    summary: 'Create multiple medicines',
    description:
      'Bulk create multiple medicines in a single operation. Supports duplicate detection and validation. Ideal for importing medicine catalogs or batch data entry.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        medicines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              unit: { type: 'string' },
              dose: { type: 'string' },
              price: { type: 'number' },
            },
            required: ['name', 'unit', 'dose', 'price'],
          },
        },
        skipDuplicates: { type: 'boolean' },
      },
      required: ['medicines'],
    },
    examples: {
      'Bulk Medicine Creation': {
        summary: 'Example of bulk medicine creation',
        value: {
          medicines: [
            {
              name: 'Paracetamol 500mg',
              description: 'Pain reliever and fever reducer',
              unit: 'tablet',
              dose: '500mg',
              price: 5000,
            },
            {
              name: 'Amoxicillin 250mg',
              description: 'Antibiotic for bacterial infections',
              unit: 'capsule',
              dose: '250mg',
              price: 8000,
            },
            {
              name: 'Ibuprofen 400mg',
              description: 'Anti-inflammatory medication',
              unit: 'tablet',
              dose: '400mg',
              price: 7500,
            },
          ],
          skipDuplicates: true,
        },
      },
    },
  })
  async createManyMedicines(
    @Body()
    body: {
      medicines: Array<{
        name: string
        description?: string
        unit: string
        dose: string
        price: number
      }>
      skipDuplicates?: boolean
    },
  ) {
    return this.medicineService.createManyMedicines(body.medicines, body.skipDuplicates || false)
  }
}
