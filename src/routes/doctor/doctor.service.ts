import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import { DoctorRepository } from '../../repositories/doctor.repository'
import { Doctor, Shift, DayOfWeek } from '@prisma/client'
import { PaginationService } from '../../shared/services/pagination.service'
import { createPaginationSchema, PaginatedResponse } from '../../shared/schemas/pagination.schema'
import {
  CreateDoctorType,
  UpdateDoctorType,
  QueryDoctorSchema,
  ManualScheduleAssignmentType,
  SwapShiftsType,
} from './doctor.model'
import { GetDoctorScheduleDto } from './doctor.dto'
import { startOfDay, endOfDay, addDays } from 'date-fns'
import * as z from 'zod'

@Injectable()
export class DoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createDoctor(data: CreateDoctorType): Promise<Doctor> {
    try {
      // Check if doctor with userId already exists
      const existingDoctor = await this.doctorRepository.findDoctorByUserId(data.userId)
      if (existingDoctor) {
        throw new ConflictException('Doctor with this user ID already exists')
      }

      return this.doctorRepository.createDoctor(data)
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      throw new InternalServerErrorException('Error creating doctor: ' + error.message)
    }
  }

  async findDoctorById(id: number): Promise<Doctor> {
    try {
      const doctor = await this.doctorRepository.findDoctorById(id, {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phoneNumber: true,
            avatar: true,
            status: true,
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        schedules: {
          orderBy: {
            date: 'asc',
          },
        },
      })
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${id} not found`)
      }
      return doctor
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error finding doctor: ' + error.message)
    }
  }

  async findDoctorByUserId(userId: number): Promise<Doctor> {
    try {
      const doctor = await this.doctorRepository.findDoctorByUserId(userId)
      if (!doctor) {
        throw new NotFoundException(`Doctor with user ID ${userId} not found`)
      }
      return doctor
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error finding doctor: ' + error.message)
    }
  }

  async findAllDoctors(query: unknown): Promise<PaginatedResponse<Doctor>> {
    try {
      // Parse pagination options
      const paginationOptions = createPaginationSchema(z.any()).parse(query)
      const queryOptions = QueryDoctorSchema.parse(query)

      // Build where condition for search
      const where: any = {}

      // Add search conditions if search term is provided
      if (queryOptions.search) {
        where.user = {
          OR: [
            { name: { contains: queryOptions.search, mode: 'insensitive' } },
            { email: { contains: queryOptions.search, mode: 'insensitive' } },
          ],
        }
      }

      // Add specialization filter if provided
      if (queryOptions.specialization) {
        where.specialization = {
          contains: queryOptions.specialization,
          mode: 'insensitive',
        }
      }

      // Get paginated data using Prisma model
      const result = (await this.paginationService.paginate(
        this.doctorRepository.getDoctorModel(),
        paginationOptions,
        where,
        {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phoneNumber: true,
              avatar: true,
              status: true,
              roleId: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  isActive: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          schedules: {
            orderBy: {
              date: 'asc',
            },
          },
        },
      )) as PaginatedResponse<Doctor>

      return result
    } catch (error) {
      throw new InternalServerErrorException('Error finding doctors: ' + error.message)
    }
  }

  async updateDoctor(id: number, data: UpdateDoctorType): Promise<Doctor> {
    try {
      const doctor = await this.doctorRepository.findDoctorById(id)
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${id} not found`)
      }

      return this.doctorRepository.updateDoctor(id, data)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error updating doctor: ' + error.message)
    }
  }

  async deleteDoctor(id: number): Promise<Doctor> {
    try {
      const doctor = await this.doctorRepository.findDoctorById(id)
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${id} not found`)
      }

      return this.doctorRepository.deleteDoctor(id)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error deleting doctor: ' + error.message)
    }
  }

  async getDoctorSchedule(id: number, schedule: GetDoctorScheduleDto) {
    const doctor = await this.doctorRepository.findDoctorById(id)
    if (!doctor) {
      throw new NotFoundException('Doctor not found')
    }

    // Set default date range if not provided
    const startDate = schedule.startDate || new Date()
    const endDate = schedule.endDate || new Date(new Date().setDate(new Date().getDate() + 30))

    return this.doctorRepository.getSchedulesByDateRange(startDate, endDate)
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    // Convert to UTC to avoid timezone issues
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    return days[utcDate.getUTCDay()] as DayOfWeek
  }

  // Calculate total shifts for a week (Monday to Saturday morning)
  private calculateTotalShifts(startDate: Date, endDate: Date): number {
    let totalShifts = 0
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getUTCDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        // Monday to Saturday
        totalShifts += dayOfWeek === 6 ? 1 : 2 // Only morning shift on Saturday
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
    return totalShifts
  }

  // Generate schedule for all doctors
  async generateSchedule(doctorsPerShift: number, startDate: Date) {
    try {
      console.log('=== Starting Schedule Generation ===')
      console.log('Input parameters:', {
        doctorsPerShift,
        startDate: startDate.toISOString(),
      })

      // Convert input date to UTC
      const utcStartDate = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
      )

      // Nếu ngày bắt đầu là chủ nhật, tính ngày thứ 2 tuần sau
      const actualStartDate =
        utcStartDate.getUTCDay() === 0
          ? new Date(Date.UTC(utcStartDate.getUTCFullYear(), utcStartDate.getUTCMonth(), utcStartDate.getUTCDate() + 1))
          : utcStartDate

      const endDate = new Date(
        Date.UTC(actualStartDate.getUTCFullYear(), actualStartDate.getUTCMonth(), actualStartDate.getUTCDate() + 6),
      )

      console.log('Date range:', {
        actualStartDate: actualStartDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      // Check if schedule already exists for this week
      const existingSchedules = await this.doctorRepository.findManySchedules({
        where: {
          date: {
            gte: startOfDay(actualStartDate),
            lte: endOfDay(endDate),
          },
        },
      })

      if (existingSchedules.length > 0) {
        throw new BadRequestException('Schedule already exists for this week')
      }

      // Get all available doctors
      const doctors = await this.doctorRepository.findAllDoctors({
        isAvailable: true,
      })

      if (doctors.length === 0) {
        throw new BadRequestException('No available doctors found')
      }

      // Validate doctorsPerShift
      if (doctorsPerShift > doctors.length) {
        throw new BadRequestException(
          `Number of doctors per shift (${doctorsPerShift}) cannot exceed total available doctors (${doctors.length})`,
        )
      }

      console.log(
        'Available doctors:',
        doctors.map((d) => ({
          id: d.id,
          specialization: d.specialization,
        })),
      )

      // Calculate total shifts and required doctors
      const totalShifts = this.calculateTotalShifts(actualStartDate, endDate) // 11 shifts (5 days × 2 + 1 morning)
      const totalRequiredShifts = totalShifts * doctorsPerShift // 55 shifts (11 × 5)

      console.log('Shift calculations:', {
        totalShifts,
        doctorsPerShift,
        totalRequiredShifts,
        numberOfDoctors: doctors.length,
      })

      // Calculate shifts per doctor
      const shiftsPerDoctor = Math.floor(totalRequiredShifts / doctors.length) // 11 shifts per doctor
      const extraShifts = totalRequiredShifts % doctors.length // 0 extra shifts

      console.log('Per doctor calculations:', {
        shiftsPerDoctor,
        extraShifts,
        note: 'Each doctor will be assigned exactly 11 shifts (2 shifts per day for 5 days + 1 morning shift on Saturday)',
      })

      // Initialize shift count for each doctor
      const doctorShifts = new Map<number, number>()
      doctors.forEach((doctor) => {
        doctorShifts.set(doctor.id, 0)
      })

      // Get all available dates and shifts
      const availableDates: { date: Date; shift: Shift }[] = []
      const currentDate = new Date(actualStartDate)
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getUTCDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const shiftsForDay = dayOfWeek === 6 ? [Shift.MORNING] : [Shift.MORNING, Shift.AFTERNOON]
          for (const shift of shiftsForDay) {
            availableDates.push({
              date: new Date(currentDate),
              shift,
            })
          }
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1)
      }

      console.log('Available dates and shifts:', {
        totalAvailableShifts: availableDates.length,
        dates: availableDates.map((d) => ({
          date: d.date.toISOString(),
          shift: d.shift,
        })),
      })

      // Group dates by day
      const datesByDay = new Map<string, { date: Date; shift: Shift }[]>()
      availableDates.forEach(({ date, shift }) => {
        const dayKey = date.toISOString().split('T')[0]
        if (!datesByDay.has(dayKey)) {
          datesByDay.set(dayKey, [])
        }
        datesByDay.get(dayKey)!.push({ date, shift })
      })

      console.log('Dates grouped by day:', {
        totalDays: datesByDay.size,
        daysWithTwoShifts: Array.from(datesByDay.values()).filter((shifts) => shifts.length === 2).length,
        daysWithOneShift: Array.from(datesByDay.values()).filter((shifts) => shifts.length === 1).length,
      })

      // Track which doctors are assigned to which days
      const doctorDayAssignments = new Map<number, Set<string>>()
      const shiftAssignments = new Map<string, number>() // Track number of doctors per shift
      doctors.forEach((doctor) => {
        doctorDayAssignments.set(doctor.id, new Set())
      })

      // Initialize shift assignments counter
      availableDates.forEach(({ date, shift }) => {
        const key = `${date.toISOString().split('T')[0]}_${shift}`
        shiftAssignments.set(key, 0)
      })

      // Assign shifts to all doctors
      for (const doctor of doctors) {
        const shiftsToAssign = shiftsPerDoctor // Assign exactly shiftsPerDoctor shifts

        console.log(`\nAssigning shifts to doctor ${doctor.id}:`, {
          shiftsToAssign,
        })

        let assignedShifts = 0

        // First try to assign full days (2 shifts per day)
        const fullDays = Array.from(datesByDay.entries())
          .filter(([dayKey, shifts]) => {
            const assignedDays = doctorDayAssignments.get(doctor.id) || new Set()
            // Check if both shifts of the day have less than doctorsPerShift
            const morningKey = `${dayKey}_MORNING`
            const afternoonKey = `${dayKey}_AFTERNOON`
            return (
              shifts.length === 2 &&
              !assignedDays.has(dayKey) &&
              (shiftAssignments.get(morningKey) || 0) < doctorsPerShift &&
              (shiftAssignments.get(afternoonKey) || 0) < doctorsPerShift
            )
          })
          .sort((a, b) => {
            // Sort by total doctors assigned to the day (ascending)
            const [dayKeyA] = a
            const [dayKeyB] = b
            const totalA =
              (shiftAssignments.get(`${dayKeyA}_MORNING`) || 0) + (shiftAssignments.get(`${dayKeyA}_AFTERNOON`) || 0)
            const totalB =
              (shiftAssignments.get(`${dayKeyB}_MORNING`) || 0) + (shiftAssignments.get(`${dayKeyB}_AFTERNOON`) || 0)
            return totalA - totalB
          })

        // Assign full days first, but limit to shiftsToAssign
        for (let i = 0; i < fullDays.length && assignedShifts < shiftsToAssign; i++) {
          const [dayKey, shifts] = fullDays[i]
          const [morning, afternoon] = shifts

          // Only assign both shifts if we have room for both
          if (assignedShifts + 2 <= shiftsToAssign) {
            await Promise.all([
              this.doctorRepository.createSchedule({
                doctor: { connect: { id: doctor.id } },
                date: morning.date,
                dayOfWeek: this.getDayOfWeek(morning.date),
                shift: morning.shift,
                isOff: false,
              }),
              this.doctorRepository.createSchedule({
                doctor: { connect: { id: doctor.id } },
                date: afternoon.date,
                dayOfWeek: this.getDayOfWeek(afternoon.date),
                shift: afternoon.shift,
                isOff: false,
              }),
            ])

            assignedShifts += 2
            const assignedDays = doctorDayAssignments.get(doctor.id) || new Set()
            assignedDays.add(dayKey)
            doctorDayAssignments.set(doctor.id, assignedDays)

            // Update shift assignments count
            const morningKey = `${dayKey}_MORNING`
            const afternoonKey = `${dayKey}_AFTERNOON`
            shiftAssignments.set(morningKey, (shiftAssignments.get(morningKey) || 0) + 1)
            shiftAssignments.set(afternoonKey, (shiftAssignments.get(afternoonKey) || 0) + 1)
          }
        }

        // If still need more shifts, assign remaining single shifts
        if (assignedShifts < shiftsToAssign) {
          const remainingShiftsToAssign = shiftsToAssign - assignedShifts
          const singleShifts = Array.from(datesByDay.entries())
            .filter(([dayKey, shifts]) => {
              const assignedDays = doctorDayAssignments.get(doctor.id) || new Set()
              const shift = shifts[0]
              const shiftKey = `${dayKey}_${shift.shift}`
              return (
                shifts.length > 0 &&
                !assignedDays.has(dayKey) &&
                (shiftAssignments.get(shiftKey) || 0) < doctorsPerShift
              )
            })
            .sort((a, b) => {
              // Sort by number of doctors assigned to the shift (ascending)
              const [dayKeyA, shiftsA] = a
              const [dayKeyB, shiftsB] = b
              const shiftA = shiftsA[0]
              const shiftB = shiftsB[0]
              const countA = shiftAssignments.get(`${dayKeyA}_${shiftA.shift}`) || 0
              const countB = shiftAssignments.get(`${dayKeyB}_${shiftB.shift}`) || 0
              return countA - countB
            })

          for (let i = 0; i < Math.min(remainingShiftsToAssign, singleShifts.length); i++) {
            const [dayKey, shifts] = singleShifts[i]
            const shift = shifts[0]

            await this.doctorRepository.createSchedule({
              doctor: { connect: { id: doctor.id } },
              date: shift.date,
              dayOfWeek: this.getDayOfWeek(shift.date),
              shift: shift.shift,
              isOff: false,
            })

            assignedShifts++
            const assignedDays = doctorDayAssignments.get(doctor.id) || new Set()
            assignedDays.add(dayKey)
            doctorDayAssignments.set(doctor.id, assignedDays)

            // Update shift assignments count
            const shiftKey = `${dayKey}_${shift.shift}`
            shiftAssignments.set(shiftKey, (shiftAssignments.get(shiftKey) || 0) + 1)
          }
        }

        doctorShifts.set(doctor.id, assignedShifts)
        console.log(`Finished assigning shifts to doctor ${doctor.id}:`, {
          totalAssigned: assignedShifts,
          remainingInSystem: Array.from(datesByDay.values()).flat().length,
        })
      }

      // Final summary
      console.log('\n=== Final Schedule Summary ===')
      const totalAssignedShifts = Array.from(doctorShifts.values()).reduce((a, b) => a + b, 0)
      console.log('Total shifts assigned:', totalAssignedShifts)
      console.log('Remaining shifts to be assigned manually:', totalRequiredShifts - totalAssignedShifts)
      console.log(
        'Shifts per doctor:',
        Array.from(doctorShifts.entries()).map(([id, shifts]) => ({
          doctorId: id,
          shifts,
        })),
      )

      // Get remaining shifts that need to be filled
      const remainingShifts = await this.getRemainingShifts(actualStartDate, endDate, doctorsPerShift)

      return {
        message: 'Schedule generated successfully',
        totalAssignedShifts,
        remainingShifts: totalRequiredShifts - totalAssignedShifts,
        shiftsNeedingDoctors: remainingShifts.map((shift) => ({
          date: shift.date.toISOString(),
          shift: shift.shift,
          dayOfWeek: this.getDayOfWeek(shift.date),
        })),
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new InternalServerErrorException('Error generating schedule: ' + error.message)
    }
  }

  // Get remaining shifts that need to be filled
  private async getRemainingShifts(startDate: Date, endDate: Date, doctorsPerShift: number) {
    const shifts: { date: Date; shift: Shift }[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        const shiftsForDay = dayOfWeek === 6 ? [Shift.MORNING] : [Shift.MORNING, Shift.AFTERNOON]

        for (const shift of shiftsForDay) {
          const doctorsInShift = await this.doctorRepository.countSchedules({
            date: {
              gte: startOfDay(currentDate),
              lte: endOfDay(currentDate),
            },
            shift,
            isOff: false,
          })

          if (doctorsInShift < doctorsPerShift) {
            shifts.push({
              date: new Date(currentDate),
              shift,
            })
          }
        }
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return shifts
  }

  // Get available doctors for a specific shift
  private async getAvailableDoctorsForShift(date: Date, shift: Shift) {
    return this.doctorRepository.findAllDoctors({
      isAvailable: true,
      schedules: {
        none: {
          date: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
          shift,
          isOff: false,
        },
      },
    })
  }

  // Request time off for a doctor
  async requestTimeOff(doctorId: number, date: Date, shift: Shift) {
    try {
      const schedule = await this.doctorRepository.findFirstSchedule({
        doctorId,
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
        shift,
      })

      if (!schedule) {
        throw new NotFoundException('Schedule not found')
      }

      return this.doctorRepository.updateSchedule(schedule.id, {
        isOff: true,
      })
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error requesting time off: ' + error.message)
    }
  }

  // Get schedules with time off requests
  async getSchedulesWithTimeOff(startDate: Date, endDate: Date) {
    try {
      return this.doctorRepository.findManySchedules({
        where: {
          date: {
            gte: startOfDay(startDate),
            lte: endOfDay(endDate),
          },
          isOff: true,
        },
        include: {
          doctor: {
            include: {
              user: true,
            },
          },
        },
      })
    } catch (error) {
      throw new InternalServerErrorException('Error getting schedules with time off: ' + error.message)
    }
  }

  // Assign doctors manually to remaining shifts
  async assignDoctorsManually(data: ManualScheduleAssignmentType) {
    try {
      const { date, shift, doctorIds, doctorsPerShift } = data
      const scheduleDate = new Date(date)

      // Validate date is not in the past
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (scheduleDate < today) {
        throw new BadRequestException('Cannot assign schedule for past dates')
      }

      // Get current schedule for this shift
      const currentSchedule = await this.doctorRepository.findManySchedules({
        where: {
          date: {
            gte: startOfDay(scheduleDate),
            lte: endOfDay(scheduleDate),
          },
          shift,
          isOff: false,
        },
      })

      // Get remaining shifts info
      const remainingShifts = await this.getRemainingShifts(scheduleDate, scheduleDate, doctorsPerShift)

      // Find if this shift is in remaining shifts
      const remainingShift = remainingShifts.find(
        (s) => s.date.toISOString() === scheduleDate.toISOString() && s.shift === shift,
      )

      if (!remainingShift) {
        throw new BadRequestException('This shift is not in the remaining shifts list')
      }

      // Calculate how many more doctors can be assigned to this shift
      const currentDoctorsCount = currentSchedule.length
      const availableSlots = doctorsPerShift - currentDoctorsCount

      // Validate number of doctors doesn't exceed available slots
      if (doctorIds.length > availableSlots) {
        throw new BadRequestException(
          `Cannot assign ${doctorIds.length} doctors. Only ${availableSlots} slots available for this shift (${doctorsPerShift} doctors required per shift)`,
        )
      }

      // Validate doctors exist and are available
      const doctors = await Promise.all(doctorIds.map((id) => this.doctorRepository.findDoctorById(id)))

      if (doctors.some((d) => !d)) {
        throw new BadRequestException('One or more doctors not found')
      }

      // Check if any doctor is already assigned to this shift
      const existingDoctors = currentSchedule.map((s) => s.doctorId)
      const duplicateDoctors = doctorIds.filter((id) => existingDoctors.includes(id))
      if (duplicateDoctors.length > 0) {
        throw new BadRequestException(
          `Doctors with IDs ${duplicateDoctors.join(', ')} are already assigned to this shift`,
        )
      }

      // Assign doctors to the shift
      const assignments = await Promise.all(
        doctorIds.map((doctorId) =>
          this.doctorRepository.createSchedule({
            doctor: { connect: { id: doctorId } },
            date: scheduleDate,
            dayOfWeek: this.getDayOfWeek(scheduleDate),
            shift,
            isOff: false,
          }),
        ),
      )

      return {
        message: 'Doctors assigned successfully',
        assignments,
        remainingShifts: availableSlots - doctorIds.length,
        doctorsPerShift,
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new InternalServerErrorException('Error assigning doctors: ' + error.message)
    }
  }

  // Swap shifts between two doctors
  async swapShifts(data: SwapShiftsType) {
    try {
      const { doctor1, doctor2 } = data
      const scheduleDate1 = new Date(doctor1.date)
      const scheduleDate2 = new Date(doctor2.date)

      // Get schedules for both doctors
      const [doctor1Schedule, doctor2Schedule] = await Promise.all([
        this.doctorRepository.findFirstSchedule({
          doctorId: doctor1.id,
          date: {
            gte: startOfDay(scheduleDate1),
            lte: endOfDay(scheduleDate1),
          },
          shift: doctor1.shift,
        }),
        this.doctorRepository.findFirstSchedule({
          doctorId: doctor2.id,
          date: {
            gte: startOfDay(scheduleDate2),
            lte: endOfDay(scheduleDate2),
          },
          shift: doctor2.shift,
        }),
      ])

      // Validate both doctors have schedules
      if (!doctor1Schedule || !doctor2Schedule) {
        throw new BadRequestException('Both doctors must have schedules for the specified dates and shifts')
      }

      // Check if either doctor has requested time off
      if (doctor1Schedule.isOff || doctor2Schedule.isOff) {
        throw new BadRequestException('Cannot swap shifts when either doctor has requested time off')
      }

      // Perform the swap
      await Promise.all([
        this.doctorRepository.updateSchedule(doctor1Schedule.id, {
          doctor: { connect: { id: doctor2.id } },
          swappedWith: { connect: { id: doctor2Schedule.id } },
        }),
        this.doctorRepository.updateSchedule(doctor2Schedule.id, {
          doctor: { connect: { id: doctor1.id } },
          swappedWith: { connect: { id: doctor1Schedule.id } },
        }),
      ])

      return {
        message: 'Shifts swapped successfully',
        doctor1: {
          id: doctor1.id,
          newSchedule: {
            date: scheduleDate2,
            shift: doctor2.shift,
          },
        },
        doctor2: {
          id: doctor2.id,
          newSchedule: {
            date: scheduleDate1,
            shift: doctor1.shift,
          },
        },
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new InternalServerErrorException('Error swapping shifts: ' + error.message)
    }
  }

  async getDoctorsByDate(date: Date) {
    return this.doctorRepository.findDoctorByDate(date)
  }
}
