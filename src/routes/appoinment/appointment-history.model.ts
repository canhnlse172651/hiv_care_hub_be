import { z } from 'zod'

export const AppointmentHistorySchema = z.object({
  id: z.number().optional(),
  appointmentId: z.number(),
  oldStatus: z.string(),
  newStatus: z.string(),
  changedBy: z.number().optional(), // userId
  changedAt: z.date().optional(),
  note: z.string().optional(),
})

export type AppointmentHistory = z.infer<typeof AppointmentHistorySchema>
