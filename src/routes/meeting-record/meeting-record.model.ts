import { z } from 'zod'

const appointmentResSchema = z.object({
  id: z.number(),
  type: z.enum(['ONLINE', 'OFFLINE']),
  title: z.string(),
  description: z.string(),
  createdAt: z.date(),
})

const userResSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  avatar: z.string(),
})

export const MeetingRecordSchema = z.object({
  id: z.number(),
  appointmentId: z.number(),
  title: z.string(),
  content: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  recordedById: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateMeetingRecordSchema = z.object({
  appointmentId: z.number().min(1, 'Appointment ID is required'),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  content: z.string().min(1, 'Content is required'),
  startTime: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
    z.date(),
  ),
  endTime: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
    z.date(),
  ),
  recordedById: z.number().min(1, 'Record by User ID is required'),
})

export const UpdateMeetingRecordSchema = z.object({
  appointmentId: z.number().min(1, 'Appointment ID is required').optional(),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  startTime: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
    z.date(),
  ).optional(),
  endTime: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
    z.date(),
  ).optional(),
  recordedById: z.number().min(1, 'Record by User ID is required').optional(),
})

export const MeetingRecordResSchema = z.object({
  id: z.number(),
  appointmentId: z.number(),
  appointment: appointmentResSchema,
  title: z.string(),
  content: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  recordedById: z.number(),
  recordedBy: userResSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const MeetingRecordFilterSchema = z.object({
  recordedById: z.number().optional(),
})