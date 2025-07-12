import { Prisma } from '@prisma/client'
import { z } from 'zod'

export const userResSchhema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
})

const decimalSchema = z
  .union([z.number(), z.string().transform((val) => parseFloat(val))])
  .transform((val) => new Prisma.Decimal(val.toString()))

export const serviceResSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  price: decimalSchema,
  startTime: z.string(),
  endTime: z.string(),
  content: z.string(),
})

export const AppointmentSchema = z.object({
  id: z.number(),
  userId: z.number(),
  doctorId: z.number(),
  serviceId: z.number(),
  appointmentTime: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
    z.date(),
  ),
  isAnonymous: z.boolean().default(false),
  type: z.enum(['ONLINE', 'OFFLINE'], {
    errorMap: () => ({ message: 'Type must be ONLINE hoặc OFFLINE' }),
  }),
  status: z.enum(['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  notes: z.string().nullable().optional(),
  patientMeetingUrl: z.string().nullable().optional(),
  doctorMeetingUrl: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateAppointmentSchema = z.object({
  userId: z.number(),
  doctorId: z.number().optional(),
  serviceId: z.number(),
  appointmentTime: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
    z.date(),
  ),
  isAnonymous: z.boolean().default(false),
  type: z.enum(['ONLINE', 'OFFLINE'], {
    errorMap: () => ({ message: 'Type must be ONLINE hoặc OFFLINE' }),
  }),
  status: z.enum(['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  notes: z.string().nullable().optional(),
  patientMeetingUrl: z.string().nullable().optional(),
  doctorMeetingUrl: z.string().nullable().optional(),
})

export const UpdateAppointmentSchema = z.object({
  userId: z.number().optional(),
  doctorId: z.number().optional(),
  serviceId: z.number().optional(),
  appointmentTime: z
    .preprocess((val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val), z.date())
    .optional(),
  isAnonymous: z.boolean().default(false).optional(),
  type: z
    .enum(['ONLINE', 'OFFLINE'], {
      errorMap: () => ({ message: 'Type must be ONLINE hoặc OFFLINE' }),
    })
    .optional(),
  status: z
    .enum(['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
    .default('PENDING')
    .optional(),
  notes: z.string().nullable().optional(),
  patientMeetingUrl: z.string().nullable().optional(),
  doctorMeetingUrl: z.string().nullable().optional(),
})

export const AppointmentResSchema = z.object({
  id: z.number(),
  user: userResSchhema,
  doctor: userResSchhema,
  service: serviceResSchema,
  appointmentTime: z.date(),
  isAnonymous: z.boolean(),
  type: z.enum(['ONLINE', 'OFFLINE']),
  status: z.enum(['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().nullable(),
  patientMeetingUrl: z.string().nullable().optional(),
  doctorMeetingUrl: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const AppointmentFilterSchema = z
  .object({
    serviceId: z.number({ message: 'Service ID must be a number' }).optional(),
    appointmentTime: z.date({ message: 'Appointment time must be a valid date' }).optional(),
    status: z.enum(['PENDING', 'CHECKIN', 'PAID', 'PROCESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
    type: z.enum(['ONLINE', 'OFFLINE']).optional(),
    serviceType: z.enum(['TEST', 'CONSULT', 'TREATMENT']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })
  .optional()
