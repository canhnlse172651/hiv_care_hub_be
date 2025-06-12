import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import CustomZodValidationPipe from '../../common/custom-zod-validate'
import { AuthType } from '../../shared/constants/auth.constant'
import { Role } from '../../shared/constants/role.constant'
import { ActiveUser } from '../../shared/decorators/active-user.decorator'
import { Auth } from '../../shared/decorators/auth.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import {
  ApiCreateTreatmentProtocol,
  ApiGetAllTreatmentProtocols,
  ApiGetProtocolsByTargetDisease,
  ApiGetProtocolsByDoctor,
  ApiGetMostPopularProtocols,
  ApiGetTreatmentProtocolById,
  ApiGetProtocolUsageStats,
  ApiUpdateTreatmentProtocol,
  ApiAddMedicineToProtocol,
  ApiUpdateMedicineInProtocol,
  ApiRemoveMedicineFromProtocol,
  ApiCloneProtocol,
  ApiDeleteTreatmentProtocol,
  ApiRestoreTreatmentProtocol,
} from '../../swagger/treatment-protocol.swagger'
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
  @ApiCreateTreatmentProtocol()
  async createProtocol(
    @Body(new CustomZodValidationPipe(CreateTreatmentProtocolDto)) data: CreateTreatmentProtocolDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.treatmentProtocolService.createProtocol(data, userId)
  }

  @Get()
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetAllTreatmentProtocols()
  async getAllProtocols(
    @Query(new CustomZodValidationPipe(QueryTreatmentProtocolDto)) query: QueryTreatmentProtocolDtoType,
  ) {
    return await this.treatmentProtocolService.getAllProtocols(query)
  }

  @Get('target-disease/:targetDisease')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetProtocolsByTargetDisease()
  async getProtocolsByTargetDisease(@Param('targetDisease') targetDisease: string) {
    return await this.treatmentProtocolService.getProtocolsByTargetDisease(targetDisease)
  }

  @Get('doctor/:doctorId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiGetProtocolsByDoctor()
  async getProtocolsByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return await this.treatmentProtocolService.getProtocolsByDoctor(doctorId)
  }

  @Get('most-popular')
  @Roles(Role.Admin, Role.Doctor)
  @ApiGetMostPopularProtocols()
  async getMostPopularProtocols(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 10
    return await this.treatmentProtocolService.getMostPopularProtocols(limitNumber)
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiGetTreatmentProtocolById()
  async getProtocolById(@Param('id', ParseIntPipe) id: number) {
    return await this.treatmentProtocolService.getProtocolById(id)
  }

  @Get(':id/usage-stats')
  @Roles(Role.Admin, Role.Doctor)
  @ApiGetProtocolUsageStats()
  async getProtocolUsageStats(@Param('id', ParseIntPipe) id: number) {
    return await this.treatmentProtocolService.getProtocolUsageStats(id)
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdateTreatmentProtocol()
  async updateProtocol(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdateTreatmentProtocolDto)) data: UpdateTreatmentProtocolDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.treatmentProtocolService.updateProtocol(id, data, userId)
  }

  @Post(':id/medicines')
  @Roles(Role.Admin, Role.Doctor)
  @ApiAddMedicineToProtocol()
  async addMedicineToProtocol(
    @Param('id', ParseIntPipe) protocolId: number,
    @Body(new CustomZodValidationPipe(AddMedicineToProtocolDto)) data: AddMedicineToProtocolDtoType,
  ) {
    return await this.treatmentProtocolService.addMedicineToProtocol(protocolId, data)
  }

  @Put(':protocolId/medicines/:medicineId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiUpdateMedicineInProtocol()
  async updateMedicineInProtocol(
    @Param('protocolId', ParseIntPipe) protocolId: number,
    @Param('medicineId', ParseIntPipe) medicineId: number,
    @Body(new CustomZodValidationPipe(UpdateMedicineInProtocolDto)) data: UpdateMedicineInProtocolDtoType,
  ) {
    return await this.treatmentProtocolService.updateMedicineInProtocol(protocolId, medicineId, data)
  }

  @Delete(':protocolId/medicines/:medicineId')
  @Roles(Role.Admin, Role.Doctor)
  @ApiRemoveMedicineFromProtocol()
  async removeMedicineFromProtocol(
    @Param('protocolId', ParseIntPipe) protocolId: number,
    @Param('medicineId', ParseIntPipe) medicineId: number,
  ) {
    return await this.treatmentProtocolService.removeMedicineFromProtocol(protocolId, medicineId)
  }

  @Post(':id/clone')
  @Roles(Role.Admin, Role.Doctor)
  @ApiCloneProtocol()
  async cloneProtocol(
    @Param('id', ParseIntPipe) originalProtocolId: number,
    @Body(new CustomZodValidationPipe(CloneProtocolDto)) data: CloneProtocolDtoType,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.treatmentProtocolService.cloneProtocol(originalProtocolId, data, userId)
  }

  @Patch(':id/restore')
  @Roles(Role.Admin)
  @ApiRestoreTreatmentProtocol()
  async restoreProtocol(@Param('id', ParseIntPipe) id: number) {
    return await this.treatmentProtocolService.restoreProtocol(id)
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Doctor)
  @ApiDeleteTreatmentProtocol()
  async deleteProtocol(@Param('id', ParseIntPipe) id: number) {
    return await this.treatmentProtocolService.deleteProtocol(id)
  }
}
