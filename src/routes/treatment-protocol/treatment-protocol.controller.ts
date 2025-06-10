/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import CustomZodValidationPipe from '../../common/custom-zod-validate'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { ActiveUser } from '../../shared/decorators/active-user.decorator'
import { Auth } from '../../shared/decorators/auth.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import {
  AddMedicineToProtocolDto,
  AddMedicineToProtocolDtoType,
  CloneProtocolDto,
  CloneProtocolDtoType,
  CreateTreatmentProtocolDto,
  CreateTreatmentProtocolDtoType,
  QueryTreatmentProtocolDto,
  QueryTreatmentProtocolDtoType,
  UpdateMedicineInProtocolDto,
  UpdateMedicineInProtocolDtoType,
  UpdateTreatmentProtocolDto,
  UpdateTreatmentProtocolDtoType,
} from './treatment-protocol.dto'
import { TreatmentProtocolService } from './treatment-protocol.service'

@ApiTags('Treatment Protocols')
@ApiBearerAuth()
@Controller('treatment-protocols')
@Auth([AuthType.Bearer])
export class TreatmentProtocolController {
  constructor(private readonly treatmentProtocolService: TreatmentProtocolService) {}

  @Post()
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Create a new treatment protocol' })
  @ApiResponse({ status: 201, description: 'Treatment protocol created successfully' })
  async createProtocol(
    @Body(new CustomZodValidationPipe(CreateTreatmentProtocolDto)) data: CreateTreatmentProtocolDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.treatmentProtocolService.createProtocol(data, userId)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Get all treatment protocols with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Treatment protocols retrieved successfully' })
  async getAllProtocols(
    @Query(new CustomZodValidationPipe(QueryTreatmentProtocolDto)) query: QueryTreatmentProtocolDtoType,
  ) {
    return await this.treatmentProtocolService.getAllProtocols(query)
  }

  @Get('target-disease/:targetDisease')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Get protocols by target disease' })
  @ApiResponse({ status: 200, description: 'Protocols filtered by target disease' })
  async getProtocolsByTargetDisease(@Param('targetDisease') targetDisease: string) {
    return await this.treatmentProtocolService.getProtocolsByTargetDisease(targetDisease)
  }

  @Get('doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Get protocols created by specific doctor' })
  @ApiResponse({ status: 200, description: 'Protocols created by doctor retrieved' })
  async getProtocolsByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return await this.treatmentProtocolService.getProtocolsByDoctor(doctorId)
  }

  @Get('most-popular')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Get most popular treatment protocols' })
  @ApiResponse({ status: 200, description: 'Most popular protocols retrieved' })
  async getMostPopularProtocols(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 10
    return await this.treatmentProtocolService.getMostPopularProtocols(limitNumber)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({ summary: 'Get treatment protocol by ID' })
  @ApiResponse({ status: 200, description: 'Treatment protocol retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Treatment protocol not found' })
  async getProtocolById(@Param('id', ParseIntPipe) id: number) {
    return await this.treatmentProtocolService.getProtocolById(id)
  }

  @Get(':id/usage-stats')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Get protocol usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved successfully' })
  async getProtocolUsageStats(@Param('id', ParseIntPipe) id: number) {
    return await this.treatmentProtocolService.getProtocolUsageStats(id)
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Update treatment protocol' })
  @ApiResponse({ status: 200, description: 'Treatment protocol updated successfully' })
  @ApiResponse({ status: 404, description: 'Treatment protocol not found' })
  async updateProtocol(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateTreatmentProtocolDto)) data: UpdateTreatmentProtocolDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.treatmentProtocolService.updateProtocol(id, data, userId)
  }

  @Post(':id/medicines')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Add medicine to protocol' })
  @ApiResponse({ status: 201, description: 'Medicine added to protocol successfully' })
  async addMedicineToProtocol(
    @Param('id', ParseIntPipe) protocolId: number,
    @Body(new CustomZodValidationPipe(AddMedicineToProtocolDto)) data: AddMedicineToProtocolDtoType,
  ) {
    return await this.treatmentProtocolService.addMedicineToProtocol(protocolId, data)
  }

  @Put(':protocolId/medicines/:medicineId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Update medicine in protocol' })
  @ApiResponse({ status: 200, description: 'Medicine in protocol updated successfully' })
  async updateMedicineInProtocol(
    @Param('protocolId', ParseIntPipe) protocolId: number,
    @Param('medicineId', ParseIntPipe) medicineId: number,
    @Body(new CustomZodValidationPipe(UpdateMedicineInProtocolDto)) data: UpdateMedicineInProtocolDtoType,
  ) {
    return await this.treatmentProtocolService.updateMedicineInProtocol(protocolId, medicineId, data)
  }

  @Delete(':protocolId/medicines/:medicineId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Remove medicine from protocol' })
  @ApiResponse({ status: 200, description: 'Medicine removed from protocol successfully' })
  async removeMedicineFromProtocol(
    @Param('protocolId', ParseIntPipe) protocolId: number,
    @Param('medicineId', ParseIntPipe) medicineId: number,
  ) {
    return await this.treatmentProtocolService.removeMedicineFromProtocol(protocolId, medicineId)
  }

  @Post(':id/clone')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Clone existing protocol' })
  @ApiResponse({ status: 201, description: 'Protocol cloned successfully' })
  async cloneProtocol(
    @Param('id', ParseIntPipe) originalProtocolId: number,
    @Body(new CustomZodValidationPipe(CloneProtocolDto)) data: CloneProtocolDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.treatmentProtocolService.cloneProtocol(originalProtocolId, data, userId)
  }

  @Patch(':id/restore')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Restore deleted protocol' })
  @ApiResponse({ status: 200, description: 'Protocol restored successfully' })
  async restoreProtocol(@Param('id', ParseIntPipe) id: number) {
    return await this.treatmentProtocolService.restoreProtocol(id)
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiOperation({ summary: 'Delete treatment protocol' })
  @ApiResponse({ status: 200, description: 'Treatment protocol deleted successfully' })
  @ApiResponse({ status: 404, description: 'Treatment protocol not found' })
  async deleteProtocol(@Param('id', ParseIntPipe) id: number) {
    return await this.treatmentProtocolService.deleteProtocol(id)
  }
}
