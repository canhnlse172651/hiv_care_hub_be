export const VALID_SCHEDULES = ['MORNING', 'AFTERNOON', 'NIGHT'] as const

type ValidSchedule = (typeof VALID_SCHEDULES)[number]

// Normalize a schedule string to ensure it is one of the valid schedules
function normalizeSchedule(schedule: unknown): ValidSchedule | null {
  if (typeof schedule === 'string' && (VALID_SCHEDULES as readonly string[]).includes(schedule)) {
    return schedule as ValidSchedule
  }
  return null
}

// Normalize custom medications to ensure they have a valid schedule
export function normalizeCustomMedications(customMedications: Record<string, any> | any[] | null) {
  if (!customMedications) return null

  // Normalize the schedule for each medication
  const normalizeMed = (med: unknown): Record<string, any> => {
    if (!med || typeof med !== 'object') return {}
    const medWithSchedule = { ...med } as Record<string, any>
    medWithSchedule.schedule = normalizeSchedule(medWithSchedule.schedule)
    return medWithSchedule
  }

  // Handle both array and object cases
  if (Array.isArray(customMedications)) {
    return customMedications.map(normalizeMed)
  }

  // If customMedications is an object, normalize each medication
  // and return a new object with normalized values
  if (typeof customMedications === 'object') {
    const result: Record<string, any> = {}
    Object.entries(customMedications).forEach(([key, med]) => {
      result[key] = normalizeMed(med)
    })
    return result
  }

  // If not array or object, return null for type safety
  return null
}
