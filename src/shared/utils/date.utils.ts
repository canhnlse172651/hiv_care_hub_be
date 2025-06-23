/**
 * Date utilities for Vietnam timezone (UTC+7)
 */

// Vietnam timezone offset in minutes (UTC+7)
const VIETNAM_TIMEZONE_OFFSET = 7 * 60

/**
 * Get hours in Vietnam timezone
 * @param date The input date (can be Date object or string)
 * @returns Hours in Vietnam timezone (0-23)
 */
export function getHours(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Create a date in UTC
  const utcDate = new Date(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    dateObj.getUTCHours(),
    dateObj.getUTCMinutes(),
    dateObj.getUTCSeconds(),
  )

  // Adjust to Vietnam time (UTC+7)
  utcDate.setMinutes(utcDate.getMinutes() + VIETNAM_TIMEZONE_OFFSET)

  return utcDate.getUTCHours()
}

/**
 * Get minutes in Vietnam timezone
 * @param date The input date (can be Date object or string)
 * @returns Minutes in Vietnam timezone (0-59)
 */
export function getMinutes(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Create a date in UTC
  const utcDate = new Date(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    dateObj.getUTCHours(),
    dateObj.getUTCMinutes(),
    dateObj.getUTCSeconds(),
  )

  // Adjust to Vietnam time (UTC+7)
  utcDate.setMinutes(utcDate.getMinutes() + VIETNAM_TIMEZONE_OFFSET)

  return utcDate.getUTCMinutes()
}

/**
 * Get seconds in Vietnam timezone
 * @param date The input date (can be Date object or string)
 * @returns Seconds in Vietnam timezone (0-59)
 */
export function getSeconds(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Create a date in UTC
  const utcDate = new Date(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    dateObj.getUTCHours(),
    dateObj.getUTCMinutes(),
    dateObj.getUTCSeconds(),
  )

  // Adjust to Vietnam time (UTC+7)
  utcDate.setMinutes(utcDate.getMinutes() + VIETNAM_TIMEZONE_OFFSET)

  return utcDate.getUTCSeconds()
}

/**
 * Format time in HH:MM format according to Vietnam timezone
 * @param date The input date (can be Date object or string)
 * @returns Time in HH:MM format
 */
export function formatTimeHHMM(date: Date | string): string {
  const hours = getHours(date).toString().padStart(2, '0')
  const minutes = getMinutes(date).toString().padStart(2, '0')

  return `${hours}:${minutes}`
}

/**
 * Parse a time string in HH:MM format to get a Date object
 * @param timeString Time string in HH:MM format
 * @param baseDate Optional base date to use (defaults to today)
 * @returns Date object with the time set according to the timeString
 */
export function parseTimeHHMM(timeString: string, baseDate?: Date): Date {
  const [hours, minutes] = timeString.split(':').map(Number)

  const date = baseDate ? new Date(baseDate) : new Date()
  date.setHours(hours, minutes, 0, 0)

  return date
}

/**
 * Compare two time strings in HH:MM format
 * @param time1 First time string in HH:MM format
 * @param time2 Second time string in HH:MM format
 * @returns -1 if time1 < time2, 0 if time1 === time2, 1 if time1 > time2
 */
export function compareTimeHHMM(time1: string, time2: string): number {
  const [hours1, minutes1] = time1.split(':').map(Number)
  const [hours2, minutes2] = time2.split(':').map(Number)

  if (hours1 !== hours2) {
    return hours1 < hours2 ? -1 : 1
  }

  if (minutes1 !== minutes2) {
    return minutes1 < minutes2 ? -1 : 1
  }

  return 0
}

/**
 * Check if a time string is between two other time strings
 * @param time Time to check
 * @param startTime Start time
 * @param endTime End time
 * @returns True if time is between startTime and endTime (inclusive)
 */
export function isTimeBetween(time: string, startTime: string, endTime: string): boolean {
  const startComparison = compareTimeHHMM(time, startTime)
  const endComparison = compareTimeHHMM(time, endTime)

  return startComparison >= 0 && endComparison <= 0
}
