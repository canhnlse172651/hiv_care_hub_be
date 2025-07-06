import { Injectable, Logger } from '@nestjs/common'
import { PatientTreatment } from '@prisma/client'
import { AppoinmentRepository } from '../../../repositories/appoinment.repository'
import { DoctorRepository } from '../../../repositories/doctor.repository'
import { PatientTreatmentRepository } from '../../../repositories/patient-treatment.repository'
import { ServiceRepository } from '../../../repositories/service.repository'
import { CreateAppointmentDtoType } from '../../appoinment/appoinment.dto'

@Injectable()
export class FollowUpAppointmentService {
  private readonly logger = new Logger(FollowUpAppointmentService.name)

  constructor(
    private readonly appointmentRepository: AppoinmentRepository,
    private readonly patientTreatmentRepository: PatientTreatmentRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly doctorRepository: DoctorRepository,
  ) {}

  /**
   * Tự động tạo lịch hẹn tái khám dựa trên treatment
   */
  async createFollowUpAppointment(
    treatmentId: number,
    followUpConfig: {
      dayOffset: number // Số ngày sau treatment bắt đầu để hẹn tái khám
      serviceId?: number // Service ID cho tái khám (mặc định sẽ tìm HIV follow-up service)
      notes?: string
      appointmentTime?: Date // Thời gian cụ thể, nếu không có sẽ tự động tính
    },
  ) {
    try {
      // 1. Lấy thông tin treatment
      const treatment = await this.patientTreatmentRepository.findPatientTreatmentById(treatmentId)
      if (!treatment) {
        throw new Error(`Treatment với ID ${treatmentId} không tồn tại`)
      }

      // 2. Kiểm tra treatment đã có follow-up appointment chưa
      const existingAppointments = await this.appointmentRepository.findAppointmentByUserId(treatment.patientId, {
        page: 1,
        limit: 1000,
        sortOrder: 'asc',
        // sortBy: 'appointmentTime',
      })
      const hasFollowUp = existingAppointments.data.some(
        (apt) =>
          apt.notes?.includes(`Follow-up for treatment ${treatmentId}`) ||
          (apt.appointmentTime >= treatment.startDate && apt.notes?.includes('follow-up')),
      )

      if (hasFollowUp) {
        this.logger.warn(`Treatment ${treatmentId} đã có follow-up appointment`)
        return { success: false, message: 'Follow-up appointment đã tồn tại' }
      }

      // 3. Tính toán ngày hẹn tái khám
      const followUpDate = this.calculateFollowUpDate(
        treatment,
        followUpConfig.dayOffset,
        followUpConfig.appointmentTime,
      )

      // 4. Tìm service phù hợp (HIV follow-up hoặc general consultation)
      const serviceId = await this.findAppropriateService(followUpConfig.serviceId)
      if (!serviceId) {
        throw new Error('Không tìm thấy service phù hợp cho follow-up appointment')
      }

      // 5. Tìm doctor phù hợp (ưu tiên doctor hiện tại của treatment)
      const doctorId = await this.findAppropriateDoctor(treatment.doctorId, followUpDate)

      // 6. Tạo appointment data
      const appointmentData: CreateAppointmentDtoType = {
        userId: treatment.patientId,
        doctorId: doctorId,
        serviceId: serviceId,
        appointmentTime: followUpDate,
        type: 'OFFLINE',
        status: 'PENDING',
        isAnonymous: false,
        notes: `Follow-up for treatment ${treatmentId}. ${followUpConfig.notes || 'Routine HIV treatment follow-up'}`,
      }

      // 7. Tạo appointment
      const appointment = await this.appointmentRepository.createAppointment(appointmentData)

      // 8. Cập nhật treatment để liên kết với appointment
      await this.linkTreatmentWithAppointment(treatmentId, appointment.id)

      this.logger.log(`Created follow-up appointment ${appointment.id} for treatment ${treatmentId}`)

      return {
        success: true,
        appointment,
        message: `Đã tạo lịch hẹn tái khám ngày ${followUpDate.toLocaleDateString('vi-VN')}`,
      }
    } catch (error) {
      this.logger.error(`Error creating follow-up appointment for treatment ${treatmentId}:`, error)
      throw error
    }
  }

  /**
   * Tạo multiple follow-up appointments cho treatment dài hạn
   */
  async createMultipleFollowUpAppointments(
    treatmentId: number,
    schedule: {
      intervalDays: number // Khoảng cách giữa các lần tái khám (30, 60, 90 ngày)
      totalAppointments: number // Tổng số lần tái khám cần tạo
      serviceId?: number
      startFromDay?: number // Bắt đầu từ ngày thứ mấy của treatment (mặc định 30)
    },
  ) {
    const appointments: any[] = []
    const { intervalDays, totalAppointments, serviceId, startFromDay = 30 } = schedule

    for (let i = 0; i < totalAppointments; i++) {
      const dayOffset = startFromDay + i * intervalDays

      try {
        const result = await this.createFollowUpAppointment(treatmentId, {
          dayOffset,
          serviceId,
          notes: `Routine follow-up #${i + 1} (${dayOffset} days after treatment start)`,
        })

        if (result.success && result.appointment) {
          appointments.push(result.appointment)
        }
      } catch (error) {
        this.logger.error(`Failed to create follow-up appointment #${i + 1} for treatment ${treatmentId}:`, error)
      }
    }

    return {
      success: appointments.length > 0,
      createdAppointments: appointments,
      message: `Đã tạo ${appointments.length}/${totalAppointments} lịch hẹn tái khám`,
    }
  }

  /**
   * Tự động tạo follow-up appointments cho treatments sắp kết thúc
   */
  async autoCreateFollowUpForEndingTreatments(daysBeforeEnd: number = 7) {
    try {
      // Lấy các treatments sắp kết thúc trong vòng X ngày
      const endingTreatments = await this.getEndingTreatments(daysBeforeEnd)

      const results: Array<{ treatmentId: number; result?: any; error?: string }> = []

      for (const treatment of endingTreatments) {
        try {
          // Tạo follow-up appointment sau 30 ngày kể từ ngày kết thúc treatment
          const endDate = treatment.endDate ? new Date(treatment.endDate) : new Date()
          const followUpDate = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000)

          const result = await this.createFollowUpAppointment(treatment.id, {
            dayOffset: 30,
            appointmentTime: followUpDate,
            notes: 'Post-treatment follow-up - scheduled automatically',
          })

          results.push({ treatmentId: treatment.id, result })
        } catch (error: any) {
          this.logger.error(`Failed to create auto follow-up for treatment ${treatment.id}:`, error)
          results.push({ treatmentId: treatment.id, error: error.message })
        }
      }

      return results
    } catch (error) {
      this.logger.error('Error in autoCreateFollowUpForEndingTreatments:', error)
      throw error
    }
  }

  /**
   * Lấy follow-up appointments cho một patient
   */
  async getFollowUpAppointmentsByPatient(patientId: number) {
    const appointments = await this.appointmentRepository.findAppointmentByUserId(patientId, {
      page: 1,
      limit: 1000,
      sortOrder: 'asc',
      // sortBy: 'appointmentTime',
    })

    return appointments.data.filter(
      (apt) => apt.notes?.includes('Follow-up') || apt.notes?.includes('follow-up') || apt.notes?.includes('tái khám'),
    )
  }

  /**
   * Cập nhật follow-up appointment
   */
  async updateFollowUpAppointment(
    appointmentId: number,
    updates: {
      appointmentTime?: Date
      notes?: string
      status?: string
    },
  ) {
    try {
      const appointment = await this.appointmentRepository.findAppointmentById(appointmentId)
      if (!appointment) {
        throw new Error(`Appointment ${appointmentId} không tồn tại`)
      }

      // Kiểm tra xem có phải follow-up appointment không
      if (!appointment.notes?.includes('Follow-up') && !appointment.notes?.includes('follow-up')) {
        throw new Error('Đây không phải follow-up appointment')
      }

      const updateData: {
        appointmentTime?: Date
        notes?: string
      } = {}
      if (updates.appointmentTime) updateData.appointmentTime = updates.appointmentTime
      if (updates.notes) updateData.notes = updates.notes

      const updatedAppointment = await this.appointmentRepository.updateAppointment(appointmentId, updateData)

      // Cập nhật status nếu có
      if (updates.status) {
        await this.appointmentRepository.updateAppointmentStatus(
          appointmentId,
          updates.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
        )
      }

      return updatedAppointment
    } catch (error) {
      this.logger.error(`Error updating follow-up appointment ${appointmentId}:`, error)
      throw error
    }
  }

  private getAppointmentUrgency(
    dayOffset: number,
    overallUrgency: 'low' | 'medium' | 'high',
  ): 'low' | 'medium' | 'high' {
    // Appointment sớm (trong 30 ngày đầu) thường quan trọng hơn
    if (dayOffset <= 14) return 'high'
    if (dayOffset <= 60) return 'medium'
    if (overallUrgency === 'high') return 'medium'
    return 'low'
  }

  private getAppointmentDescription(dayOffset: number, appointmentNumber: number): string {
    if (dayOffset <= 14) return `Early monitoring appointment #${appointmentNumber} - Critical period`
    if (dayOffset <= 30) return `First month follow-up #${appointmentNumber} - Monitor adaptation`
    if (dayOffset <= 90) return `Short-term follow-up #${appointmentNumber} - Assess effectiveness`
    if (dayOffset <= 180) return `Medium-term follow-up #${appointmentNumber} - Routine monitoring`
    return `Long-term follow-up #${appointmentNumber} - Maintenance check`
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private calculateFollowUpDate(treatment: PatientTreatment, dayOffset: number, specificTime?: Date): Date {
    if (specificTime) {
      return new Date(specificTime)
    }

    const startDate = new Date(treatment.startDate)
    const followUpDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000)

    // Set time to 9:00 AM for follow-up appointments
    followUpDate.setHours(9, 0, 0, 0)

    // If it's weekend, move to next Monday
    if (followUpDate.getDay() === 0) {
      // Sunday
      followUpDate.setDate(followUpDate.getDate() + 1)
    } else if (followUpDate.getDay() === 6) {
      // Saturday
      followUpDate.setDate(followUpDate.getDate() + 2)
    }

    return followUpDate
  }

  private async findAppropriateService(preferredServiceId?: number): Promise<number | null> {
    if (preferredServiceId) {
      const service = await this.serviceRepository.findServiceById(preferredServiceId)
      return service ? preferredServiceId : null
    }

    // Tìm HIV follow-up service hoặc general consultation từ tất cả services
    const services = await this.serviceRepository.findAllServices()
    const hivService = services.find(
      (s: any) =>
        s.name?.toLowerCase().includes('hiv') ||
        s.name?.toLowerCase().includes('follow') ||
        s.description?.toLowerCase().includes('hiv'),
    )

    return hivService ? hivService.id : services[0]?.id || null
  }

  private async findAppropriateDoctor(preferredDoctorId?: number, appointmentDate?: Date): Promise<number> {
    // Ưu tiên doctor hiện tại của treatment
    if (preferredDoctorId) {
      const doctor = await this.doctorRepository.findDoctorById(preferredDoctorId)
      if (doctor) {
        // TODO: Kiểm tra doctor có available vào ngày hẹn không
        return preferredDoctorId
      }
    }

    // Tìm doctor available (tạm thời trả về doctor đầu tiên)
    const availableDoctors = await this.doctorRepository.findAllDoctors()
    if (availableDoctors.length === 0) {
      throw new Error('Không có doctor nào available')
    }
    if (availableDoctors.length === 1) {
      return availableDoctors[0].id
    }
    return availableDoctors[Math.floor(Math.random() * availableDoctors.length)].id
  }

  private async linkTreatmentWithAppointment(treatmentId: number, appointmentId: number) {
    // Có thể lưu thông tin liên kết trong notes hoặc tạo bảng riêng
    // Tạm thời cập nhật notes của treatment
    const treatment = await this.patientTreatmentRepository.findPatientTreatmentById(treatmentId)
    const currentNotes = treatment?.notes || ''
    const updatedNotes = `${currentNotes}\nFollow-up appointment created: ${appointmentId} on ${new Date().toISOString()}`

    await this.patientTreatmentRepository.updatePatientTreatment(treatmentId, {
      notes: updatedNotes,
    })
  }

  private async getEndingTreatments(daysBeforeEnd: number): Promise<PatientTreatment[]> {
    const now = new Date()
    const futureDate = new Date(now.getTime() + daysBeforeEnd * 24 * 60 * 60 * 1000)

    // Lấy treatments có endDate trong khoảng từ hôm nay đến daysBeforeEnd ngày nữa
    return await this.patientTreatmentRepository.getPatientTreatmentsByDateRange(now, futureDate)
  }

  /**
   * Lấy lịch trình tái khám được khuyến nghị dựa trên treatment
   */
  async getRecommendedSchedule(treatmentId: number) {
    try {
      // 1. Lấy thông tin treatment
      const treatment = await this.patientTreatmentRepository.findPatientTreatmentById(treatmentId)
      if (!treatment) {
        throw new Error(`Treatment với ID ${treatmentId} không tồn tại`)
      }

      // 2. Logic đơn giản để tính recommended schedule
      const recommendedSchedule = this.calculateRecommendedSchedule(treatment)

      // 3. Tính toán dates cụ thể cho mỗi appointment
      const treatmentStartDate = new Date(treatment.startDate)
      const scheduleWithDates = recommendedSchedule.recommendedIntervals.map((dayOffset, index) => {
        const appointmentDate = new Date(treatmentStartDate)
        appointmentDate.setDate(appointmentDate.getDate() + dayOffset)

        return {
          appointmentNumber: index + 1,
          dayOffset,
          scheduledDate: appointmentDate.toISOString(),
          urgency: this.getAppointmentUrgency(dayOffset, recommendedSchedule.urgencyLevel),
          description: this.getAppointmentDescription(dayOffset, index + 1),
        }
      })

      return {
        treatmentId,
        patientId: treatment.patientId,
        treatmentStartDate: treatment.startDate,
        recommendation: {
          ...recommendedSchedule,
          schedule: scheduleWithDates,
          createdAt: new Date().toISOString(),
        },
        nextAction: {
          suggestion: 'Tạo lịch hẹn theo khuyến nghị',
          endpoint: `/patient-treatments/follow-up-appointments/${treatmentId}/multiple`,
          payload: {
            intervalDays: recommendedSchedule.recommendedIntervals,
            totalAppointments: recommendedSchedule.totalAppointments,
            startFromDay: recommendedSchedule.startFromDay,
          },
        },
      }
    } catch (error) {
      this.logger.error(`Lỗi khi lấy recommended schedule cho treatment ${treatmentId}:`, error)
      throw new Error(`Không thể lấy recommended schedule: ${error.message}`)
    }
  }

  private calculateRecommendedSchedule(treatment: PatientTreatment): {
    recommendedIntervals: number[]
    totalAppointments: number
    startFromDay: number
    notes: string
    urgencyLevel: 'low' | 'medium' | 'high'
    specialInstructions: string[]
  } {
    // Logic đơn giản dựa trên treatment duration và timing
    const treatmentStartDate = new Date(treatment.startDate)
    const currentDate = new Date()
    const monthsSinceStart = Math.floor(
      (currentDate.getTime() - treatmentStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000),
    )

    let riskLevel: 'low' | 'medium' | 'high' = 'medium'
    let intervals: number[] = []
    let notes = ''
    const specialInstructions: string[] = ['Monitor for side effects', 'Check adherence']

    // Nếu có custom medications -> risk cao hơn
    if (treatment.customMedications && Object.keys(treatment.customMedications).length > 0) {
      riskLevel = 'high'
      specialInstructions.push('Monitor custom medication interactions')
    }

    if (monthsSinceStart < 6) {
      // New treatment - more frequent follow-ups
      if (riskLevel === 'high') {
        intervals = [14, 30, 60, 90, 120, 180] // Week 2, Month 1,2,3,4,6
        notes = 'New high-risk patient - intensive monitoring schedule'
        specialInstructions.push('Weekly phone check for first month')
      } else if (riskLevel === 'medium') {
        intervals = [30, 60, 90, 180] // Month 1,2,3,6
        notes = 'New patient - standard monitoring schedule'
      } else {
        // low
        intervals = [30, 90, 180] // Month 1,3,6
        notes = 'New low-risk patient - standard schedule'
      }
    } else {
      // Established treatment - maintenance schedule
      if (riskLevel === 'high') {
        intervals = [90, 180, 270, 360] // Every 3 months
        notes = 'Established high-risk patient - quarterly monitoring'
      } else if (riskLevel === 'medium') {
        intervals = [180, 360] // Every 6 months
        notes = 'Established patient - bi-annual monitoring'
      } else {
        // low
        intervals = [360] // Annually
        notes = 'Stable patient - annual monitoring'
      }
    }

    return {
      recommendedIntervals: intervals,
      totalAppointments: intervals.length,
      startFromDay: intervals[0] || 30,
      notes,
      urgencyLevel: riskLevel,
      specialInstructions,
    }
  }
}
