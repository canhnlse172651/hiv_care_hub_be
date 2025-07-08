import { z } from 'zod'
import { Shift, DayOfWeek } from '@prisma/client'

// Base Doctor Schema
export const DoctorSchema = z.object({
  id: z.number(),
  userId: z.number(),
  specialization: z.string().min(1).max(100),
  certifications: z.array(z.string()),
 
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
})

// Doctor Schedule Schema
export const DoctorScheduleSchema = z.object({
  id: z.number(),
  doctorId: z.number(),
  date: z.date(),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  shift: z.nativeEnum(Shift),
 
  swappedWithId: z.number().nullable(),
  swappedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
})

// Create Doctor Schema
export const CreateDoctorSchema = z.object({
  userId: z.number(),
  specialization: z.string().optional(),
  certifications: z.array(z.string()).optional(),
})

// Update Doctor Schema
export const UpdateDoctorSchema = z.object({
  specialization: z.string().optional(),
  certifications: z.array(z.string()).optional(),
})

// Query Doctor Schema
export const QueryDoctorSchema = z.object({
  // Pagination fields
  page: z
    .preprocess((val) => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((val) => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().min(1))
    .optional()
    .default(10),
  sortBy: z.enum(['specialization', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  
  // Search and filter fields
  search: z.string().optional(),
  specialization: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
})

// Create Schedule Schema
export const CreateScheduleSchema = z.object({
  startDate: z.string().transform((str) => new Date(str)),
})

// Swap Shifts Schema
export const SwapShiftsSchema = z
  .object({
    doctor1: z.object({
      id: z.number().int().positive(),
      date: z.string().transform((str) => new Date(str)),
      shift: z.enum(['MORNING', 'AFTERNOON']),
    }),
    doctor2: z.object({
      id: z.number().int().positive(),
      date: z.string().transform((str) => new Date(str)),
      shift: z.enum(['MORNING', 'AFTERNOON']),
    }),
  })
  .refine(
    (data) => {
      const date1 = new Date(data.doctor1.date)
      const date2 = new Date(data.doctor2.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Kiểm tra không phải ngày trong quá khứ
      if (date1 < today || date2 < today) {
        return false
      }

      // Kiểm tra khoảng cách giữa 2 ngày không quá 5 ngày
      const diffTime = Math.abs(date2.getTime() - date1.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays > 5) {
        return false
      }

      // Kiểm tra cả 2 ngày đều trong khoảng T2-T7
      const day1 = date1.getDay()
      const day2 = date2.getDay()
      if (day1 === 0 || day2 === 0) {
        // Chủ nhật
        return false
      }

      return true
    },
    {
      message:
        'Invalid dates: Dates must be in the future, within 5 days of each other, and between Monday and Saturday',
    },
  )

// Create Schedule Config Schema
export const CreateScheduleConfigSchema = z
  .object({
    doctorsPerShift: z.number().min(1).max(10),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: 'Start date must be before end date',
    path: ['endDate'],
  })

// Register Schedule Schema
export const RegisterScheduleSchema = z
  .object({
    date: z.string().transform((str) => new Date(str)),
    shift: z.nativeEnum(Shift),
  })
  .refine(
    (data) => {
      const dayOfWeek = data.date.getDay()
      // Không cho phép đăng ký vào Chủ nhật (0) hoặc chiều thứ 7 (6)
      return dayOfWeek !== 0 && !(dayOfWeek === 6 && data.shift === Shift.AFTERNOON)
    },
    {
      message: 'Cannot register for Sunday or Saturday afternoon',
      path: ['date'],
    },
  )

// Get Doctor Schedule Schema
export const GetDoctorScheduleSchema = z
  .object({
    startDate: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
    endDate: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate
      }
      return true
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['endDate'],
    },
  )

// Generate Schedule Schema
export const GenerateScheduleSchema = z.object({
  startDate: z
    .string()
    .transform((str) => new Date(str))
    .refine(
      (date) => {
        const startDate = new Date(date)
        const utcStartDate = new Date(
          Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
        )

        const today = new Date()
        const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

        const nextMonday = new Date(
          Date.UTC(
            utcToday.getUTCFullYear(),
            utcToday.getUTCMonth(),
            utcToday.getUTCDate() + ((8 - utcToday.getUTCDay()) % 7),
          ),
        )

        // Cho phép tạo lịch trong các trường hợp:
        // 1. Chủ nhật cho tuần tiếp theo
        // 2. Thứ 2 tuần tiếp theo
        // 3. Thứ 2 tuần hiện tại nếu chưa có lịch
        return (
          (utcStartDate.getUTCDay() === 0 && utcStartDate >= utcToday) ||
          (utcStartDate.getUTCDay() === 1 && utcStartDate >= utcToday)
        )
      },
      {
        message:
          'Start date must be either Sunday (for next week) or Monday (for current/next week) and cannot be in the past',
      },
    ),
  doctorsPerShift: z.number().int().min(1, {
    message: 'Number of doctors per shift must be at least 1',
  }),
})

// Manual Schedule Assignment Schema
export const ManualScheduleAssignmentSchema = z.object({
  doctorId: z.number().int().positive({
    message: 'Doctor ID must be a positive integer',
  }),
  date: z.string().transform((str) => new Date(str)),
  shift: z.nativeEnum(Shift),
}).refine(
  (data) => {
    const scheduleDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return scheduleDate >= today
  },
  {
    message: 'Cannot assign schedule for past dates',
    path: ['date'],
  }
)

export const GetDoctorByDateSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
})

// Types
export type DoctorType = z.infer<typeof DoctorSchema>
export type DoctorScheduleType = z.infer<typeof DoctorScheduleSchema>
export type CreateDoctorType = z.infer<typeof CreateDoctorSchema>
export type UpdateDoctorType = z.infer<typeof UpdateDoctorSchema>
export type QueryDoctorType = z.infer<typeof QueryDoctorSchema>
export type SwapShiftsType = z.infer<typeof SwapShiftsSchema>
export type CreateScheduleConfigType = z.infer<typeof CreateScheduleConfigSchema>
export type RegisterScheduleType = z.infer<typeof RegisterScheduleSchema>
export type GetDoctorScheduleType = z.infer<typeof GetDoctorScheduleSchema>
export type ManualScheduleAssignmentType = z.infer<typeof ManualScheduleAssignmentSchema>
export type GetDoctorByDateType = z.infer<typeof GetDoctorByDateSchema>
