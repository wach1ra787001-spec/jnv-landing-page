/**
 * Trade Session Detection Engine
 *
 * Determines trading session for trades based on:
 * 1. The documented trade time (entered by user)
 * 2. The user's UTC timezone offset (from Settings)
 *
 * CRITICAL: Never uses device/browser/server time, location, or IP address.
 * The user's selected UTC offset is the single source of truth.
 */

/**
 * Session classification result
 */
export interface SessionDetectionResult {
  /** The documented trade time as entered by user */
  documented_trade_time: string

  /** User's UTC offset (e.g., '+3', '-4', '0') */
  user_timezone_offset: number

  /** Calculated UTC time from documented time and offset */
  calculated_utc_time: string

  /** Session name: 'Asian Session', 'London Session', 'New York Session', 'Off Session', or 'Unknown' */
  session_name: 'Asian Session' | 'London Session' | 'New York Session' | 'Off Session' | 'Unknown'

  /** Whether the session could be determined */
  is_valid: boolean

  /** Error message if session could not be determined */
  error?: string
}

/**
 * Master Session Schedule (UTC)
 * All times in 24-hour UTC format
 */
const SESSION_SCHEDULE = {
  asian: { start: 23, end: 6, name: 'Asian Session' as const },
  london: { start: 7, end: 12, name: 'London Session' as const },
  newyork: { start: 13, end: 20, name: 'New York Session' as const },
}

/**
 * Convert documented trade time to UTC using user's timezone offset
 *
 * Formula: UTC Time = Documented Time - User UTC Offset
 *
 * Examples:
 * - User UTC+3, trade at 08:00 → UTC = 08:00 - 3 = 05:00
 * - User UTC-4, trade at 09:00 → UTC = 09:00 - (-4) = 13:00
 *
 * @param documentedTimeStr - Trade time as documented by user (ISO string or parseable date)
 * @param userUtcOffset - User's UTC offset in hours (e.g., 3 for UTC+3, -4 for UTC-4)
 * @returns UTC time as Date object
 * @throws Error if time cannot be parsed
 */
function convertToUTC(documentedTimeStr: string, userUtcOffset: number): Date {
  // Parse the documented time
  const documentedTime = new Date(documentedTimeStr)

  if (isNaN(documentedTime.getTime())) {
    throw new Error(`Invalid trade time format: "${documentedTimeStr}"`)
  }

  // Calculate UTC: subtract the user's offset
  // userUtcOffset is in hours, convert to milliseconds
  const offsetMs = userUtcOffset * 60 * 60 * 1000
  const utcTime = new Date(documentedTime.getTime() - offsetMs)

  return utcTime
}

/**
 * Determine which session a UTC hour falls into
 *
 * @param utcHour - Hour in UTC (0-23)
 * @returns Session name or 'Off Session'
 */
function classifySessionByUTCHour(
  utcHour: number,
): 'Asian Session' | 'London Session' | 'New York Session' | 'Off Session' {
  // Normalize hour to 0-23 range
  utcHour = ((utcHour % 24) + 24) % 24

  // Asian Session: 23:00 - 06:59 UTC (wraps midnight)
  if (utcHour >= SESSION_SCHEDULE.asian.start || utcHour < SESSION_SCHEDULE.asian.end) {
    return SESSION_SCHEDULE.asian.name
  }

  // London Session: 07:00 - 12:59 UTC
  if (utcHour >= SESSION_SCHEDULE.london.start && utcHour < SESSION_SCHEDULE.london.end) {
    return SESSION_SCHEDULE.london.name
  }

  // New York Session: 13:00 - 20:59 UTC
  if (utcHour >= SESSION_SCHEDULE.newyork.start && utcHour < SESSION_SCHEDULE.newyork.end) {
    return SESSION_SCHEDULE.newyork.name
  }

  // All other times
  return 'Off Session'
}

/**
 * Detect trading session for a trade
 *
 * Process:
 * 1. Validate inputs
 * 2. Convert documented time to UTC
 * 3. Extract UTC hour
 * 4. Classify against master schedule
 * 5. Return session name
 *
 * @param documentedTimeStr - Trade time as documented by user
 * @param userUtcOffset - User's UTC offset in hours
 * @returns SessionDetectionResult with session name and validation status
 */
export function detectTradeSession(
  documentedTimeStr: string | null | undefined,
  userUtcOffset: number | null | undefined,
): SessionDetectionResult {
  // Validation: check for missing inputs
  if (!documentedTimeStr || documentedTimeStr.trim() === '') {
    return {
      documented_trade_time: documentedTimeStr || '',
      user_timezone_offset: userUtcOffset || 0,
      calculated_utc_time: '',
      session_name: 'Unknown',
      is_valid: false,
      error: 'Trade time is missing or empty',
    }
  }

  if (userUtcOffset === null || userUtcOffset === undefined) {
    return {
      documented_trade_time: documentedTimeStr,
      user_timezone_offset: 0,
      calculated_utc_time: '',
      session_name: 'Unknown',
      is_valid: false,
      error: 'User UTC offset is not set',
    }
  }

  try {
    // Step 1: Convert to UTC
    const utcTime = convertToUTC(documentedTimeStr, userUtcOffset)

    // Step 2: Get UTC hour
    const utcHour = utcTime.getUTCHours()

    // Step 3: Classify session
    const sessionName = classifySessionByUTCHour(utcHour)

    return {
      documented_trade_time: documentedTimeStr,
      user_timezone_offset: userUtcOffset,
      calculated_utc_time: utcTime.toISOString(),
      session_name: sessionName,
      is_valid: true,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      documented_trade_time: documentedTimeStr,
      user_timezone_offset: userUtcOffset,
      calculated_utc_time: '',
      session_name: 'Unknown',
      is_valid: false,
      error: errorMsg,
    }
  }
}

/**
 * Get user's UTC offset from their IANA timezone name
 * (Helper function for apps still using IANA timezones)
 *
 * @param ianaTimezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns UTC offset in hours (can be fractional for some timezones)
 */
export function getUtcOffsetFromIanaTimezone(ianaTimezone: string): number {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const parts = formatter.formatToParts(now)
    const dateObj: Record<string, string> = {}

    for (const part of parts) {
      if (part.type !== 'literal') {
        dateObj[part.type] = part.value
      }
    }

    const tzDate = new Date(
      Number(dateObj.year),
      Number(dateObj.month) - 1,
      Number(dateObj.day),
      Number(dateObj.hour),
      Number(dateObj.minute),
      Number(dateObj.second),
    )

    const offsetMs = now.getTime() - tzDate.getTime()
    const offsetHours = offsetMs / (1000 * 60 * 60)

    return offsetHours
  } catch (error) {
    console.warn(`Failed to get UTC offset for timezone "${ianaTimezone}":`, error)
    return 0
  }
}

/**
 * Validate UTC offset is within reasonable range
 * Valid range: -12 to +14 hours
 *
 * @param offset - UTC offset in hours
 * @returns true if valid, false otherwise
 */
export function isValidUtcOffset(offset: number): boolean {
  return typeof offset === 'number' && offset >= -12 && offset <= 14
}

/**
 * Format UTC offset for display (e.g., "UTC+3" or "UTC-4")
 *
 * @param offset - UTC offset in hours
 * @returns Formatted string
 */
export function formatUtcOffset(offset: number): string {
  if (!isValidUtcOffset(offset)) {
    return 'Invalid'
  }

  const sign = offset >= 0 ? '+' : ''
  const absoluteOffset =
    offset === Math.floor(offset) ? offset : offset.toFixed(1)

  return `UTC${sign}${absoluteOffset}`
}

/**
 * Export session schedule for reference and testing
 */
export { SESSION_SCHEDULE }
