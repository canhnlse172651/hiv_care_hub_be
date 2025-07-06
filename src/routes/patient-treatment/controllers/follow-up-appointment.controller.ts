import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthType } from '../../../shared/constants/auth.constant'
import { Role } from '../../../shared/constants/role.constant'
import { Auth } from '../../../shared/decorators/auth.decorator'
import { Roles } from '../../../shared/decorators/roles.decorator'
import { FollowUpAppointmentService } from '../services/follow-up-appointment.service'

@ApiTags('Follow-up Appointments')
@ApiBearerAuth()
@Auth([AuthType.Bearer])
@Controller('patient-treatments/follow-up-appointments')
export class FollowUpAppointmentController {
  constructor(private readonly followUpService: FollowUpAppointmentService) {}

  @Post(':treatmentId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Tạo lịch hẹn tái khám cho treatment',
    description: 'Tự động tạo lịch hẹn tái khám dựa trên treatment hiện tại',
  })
  @ApiResponse({ status: 201, description: 'Tạo follow-up appointment thành công' })
  @ApiResponse({ status: 400, description: 'Lỗi validation hoặc business logic' })
  async createFollowUpAppointment(
    @Param('treatmentId', ParseIntPipe) treatmentId: number,
    @Body()
    config: {
      dayOffset: number
      serviceId?: number
      notes?: string
      appointmentTime?: string
    },
  ) {
    const followUpConfig = {
      ...config,
      appointmentTime: config.appointmentTime ? new Date(config.appointmentTime) : undefined,
    }

    return await this.followUpService.createFollowUpAppointment(treatmentId, followUpConfig)
  }

  @Post(':treatmentId/multiple')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Tạo nhiều lịch hẹn tái khám theo lịch trình',
    description: 'Tạo lịch trình tái khám định kỳ cho treatment dài hạn',
  })
  @ApiResponse({ status: 201, description: 'Tạo multiple follow-up appointments thành công' })
  async createMultipleFollowUpAppointments(
    @Param('treatmentId', ParseIntPipe) treatmentId: number,
    @Body()
    schedule: {
      intervalDays: number
      totalAppointments: number
      serviceId?: number
      startFromDay?: number
    },
  ) {
    return await this.followUpService.createMultipleFollowUpAppointments(treatmentId, schedule)
  }

  @Post('auto-create/ending-treatments')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Tự động tạo follow-up cho treatments sắp kết thúc',
    description: 'Chạy tự động để tạo lịch hẹn cho những treatment sắp kết thúc',
  })
  @ApiResponse({ status: 201, description: 'Auto-create follow-up appointments thành công' })
  async autoCreateFollowUpForEndingTreatments(@Query('daysBeforeEnd') daysBeforeEnd?: number) {
    return await this.followUpService.autoCreateFollowUpForEndingTreatments(daysBeforeEnd || 7)
  }

  @Get('patient/:patientId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff, Role.Patient)
  @ApiOperation({
    summary: 'Lấy danh sách follow-up appointments của patient',
    description: 'Xem tất cả lịch hẹn tái khám của một bệnh nhân',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách follow-up appointments thành công' })
  async getFollowUpAppointmentsByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return await this.followUpService.getFollowUpAppointmentsByPatient(patientId)
  }

  @Put(':appointmentId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Cập nhật follow-up appointment',
    description: 'Cập nhật thông tin lịch hẹn tái khám',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật follow-up appointment thành công' })
  async updateFollowUpAppointment(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
    @Body()
    updates: {
      appointmentTime?: string
      notes?: string
      status?: string
    },
  ) {
    const updateData = {
      ...updates,
      appointmentTime: updates.appointmentTime ? new Date(updates.appointmentTime) : undefined,
    }

    return await this.followUpService.updateFollowUpAppointment(appointmentId, updateData)
  }

  @Post('bulk-create')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Tạo hàng loạt follow-up appointments',
    description: 'Tạo follow-up appointments cho nhiều treatments cùng lúc',
  })
  @ApiResponse({ status: 201, description: 'Bulk create follow-up appointments thành công' })
  async bulkCreateFollowUpAppointments(
    @Body()
    bulkData: {
      treatmentIds: number[]
      defaultConfig: {
        dayOffset: number
        serviceId?: number
        notes?: string
      }
    },
  ) {
    const results: Array<{ treatmentId: number; result?: any; error?: string }> = []

    for (const treatmentId of bulkData.treatmentIds) {
      try {
        const result = await this.followUpService.createFollowUpAppointment(treatmentId, bulkData.defaultConfig)
        results.push({ treatmentId, result })
      } catch (error: any) {
        results.push({ treatmentId, error: error.message })
      }
    }

    return {
      success: results.filter((r) => !r.error).length > 0,
      results,
      summary: {
        total: bulkData.treatmentIds.length,
        successful: results.filter((r) => !r.error).length,
        failed: results.filter((r) => r.error).length,
      },
    }
  }

  @Get('statistics')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Thống kê follow-up appointments',
    description: 'Lấy thống kê về lịch hẹn tái khám trong hệ thống',
  })
  @ApiResponse({ status: 200, description: 'Lấy thống kê thành công' })
  getFollowUpStatistics(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    // Tạm thời trả về mock data, có thể implement sau
    return {
      totalFollowUpAppointments: 0,
      upcomingAppointments: 0,
      completedAppointments: 0,
      missedAppointments: 0,
      byStatus: {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      },
      message: 'Statistics feature - coming soon',
    }
  }

  @Get('recommended-schedule/:treatmentId')
  @Roles(Role.Admin, Role.Doctor, Role.Staff)
  @ApiOperation({
    summary: 'Lấy lịch trình tái khám được khuyến nghị',
    description: 'Tự động tính toán lịch trình tái khám phù hợp dựa trên loại điều trị và đặc điểm bệnh nhân',
  })
  @ApiResponse({ status: 200, description: 'Lấy recommended schedule thành công' })
  async getRecommendedFollowUpSchedule(@Param('treatmentId', ParseIntPipe) treatmentId: number) {
    return await this.followUpService.getRecommendedSchedule(treatmentId)
  }
}
