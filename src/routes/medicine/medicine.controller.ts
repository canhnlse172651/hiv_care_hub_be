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
  @ApiOperation({ summary: 'Get medicines by price range' })
  @ApiQuery({ name: 'minPrice', required: true, type: Number })
  @ApiQuery({ name: 'maxPrice', required: true, type: Number })
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
  @ApiOperation({ summary: 'Advanced search for medicines' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'unit', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
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
  @ApiOperation({ summary: 'Create multiple medicines' })
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
