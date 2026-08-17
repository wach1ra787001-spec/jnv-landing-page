import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { format, parse, differenceInMinutes, addHours, startOfDay, isSameDay } from 'date-fns'

export type TradingSession = 'asia' | 'london' | 'newyork' | 'overlap' | 'closed'

interface SessionTimings {
  asian: { utcStart: number; utcEnd: number; name: string }
  london: { utcStart: number; utcEnd: number; name: string }
  newyork: { utcStart: number; utcEnd: number; name: string }
}

const SESSION_TIMINGS: SessionTimings = {
  asian: { utcStart: 22, utcEnd: 6, name: 'Asian' }, // 22:00 - 06:00 UTC
  london: { utcStart: 7, utcEnd: 15, name: 'London' }, // 07:00 - 15:00 UTC
  newyork: { utcStart: 12, utcEnd: 20, name: 'New York' }, // 12:00 - 20:00 UTC
}

/**
 * Centralized Time Service - Single source of truth for all timezone conversions
 * All data is stored in UTC, this service converts to user's timezone for display
 */
export class TimeService {
  private userTimezone: string
  private sessionTimezoneOffset: number = 0

  constructor(userTimezone: string = 'UTC') {
    this.userTimezone = userTimezone
    this.updateSessionOffset()
  }

  /**
   * Set the user's timezone (IANA format: e.g., 'America/New_York', 'Europe/London')
   */
  setTimezone(timezone: string): void {
    this.userTimezone = timezone
    this.updateSessionOffset()
  }

  /**
   * Get the user's current timezone
   */
  getTimezone(): string {
    return this.userTimezone
  }

  /**
   * Update session offset for trading session calculations
   */
  private updateSessionOffset(): void {
    const now = new Date()
    const userTime = toZonedTime(now, this.userTimezone)
    this.sessionTimezoneOffset = (userTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  }

  /**
   * Convert UTC timestamp to user's timezone
   */
  toUserTime(utcDate: Date | number): Date {
    if (typeof utcDate === 'number') {
      utcDate = new Date(utcDate)
    }
    return toZonedTime(utcDate, this.userTimezone)
  }

  /**
   * Convert user's timezone date to UTC
   */
  toUTC(localDate: Date): Date {
    return fromZonedTime(localDate, this.userTimezone)
  }

  /**
   * Format date/time in user's timezone
   * @param date UTC date to format
   * @param formatStr date-fns format string (default: 'MMM dd, yyyy HH:mm')
   */
  format(date: Date | number, formatStr: string = 'MMM dd, yyyy HH:mm'): string {
    if (typeof date === 'number') {
      date = new Date(date)
    }
    return formatInTimeZone(date, this.userTimezone, formatStr)
  }

  /**
   * Format date only in user's timezone
   */
  formatDate(date: Date | number): string {
    return this.format(date, 'MMM dd, yyyy')
  }

  /**
   * Format time only in user's timezone
   */
  formatTime(date: Date | number): string {
    return this.format(date, 'HH:mm:ss')
  }

  /**
   * Get formatted timezone offset (e.g., "UTC-5" or "UTC+1")
   */
  getTimezoneOffset(): string {
    const now = new Date()
    const userTime = toZonedTime(now, this.userTimezone)
    const offsetMs = userTime.getTime() - now.getTime()
    const offsetHours = offsetMs / (1000 * 60 * 60)
    const sign = offsetHours >= 0 ? '+' : '-'
    return `UTC${sign}${Math.abs(offsetHours)}`
  }

  /**
   * Determine which trading session a UTC trade occurred in based on user's timezone
   */
  getSessionFromUTC(utcDate: Date | number): TradingSession {
    if (typeof utcDate === 'number') {
      utcDate = new Date(utcDate)
    }

    const utcHour = utcDate.getUTCHours()

    // Determine overlap periods (London 7-15 UTC, NY 12-20 UTC)
    const isLondonActive = utcHour >= SESSION_TIMINGS.london.utcStart && utcHour < SESSION_TIMINGS.london.utcEnd
    const isNYActive = utcHour >= SESSION_TIMINGS.newyork.utcStart && utcHour < SESSION_TIMINGS.newyork.utcEnd
    const isAsianActive = utcHour >= SESSION_TIMINGS.asian.utcStart || utcHour < SESSION_TIMINGS.asian.utcEnd

    // Overlap period: both London and NY are active (12:00-15:00 UTC)
    if (isLondonActive && isNYActive) {
      return 'overlap'
    }

    if (isLondonActive) return 'london'
    if (isNYActive) return 'newyork'
    if (isAsianActive) return 'asia'

    return 'closed'
  }

  /**
   * Get all active sessions at a given UTC time
   */
  getActiveSessions(utcDate: Date | number): TradingSession[] {
    if (typeof utcDate === 'number') {
      utcDate = new Date(utcDate)
    }

    const utcHour = utcDate.getUTCHours()
    const sessions: TradingSession[] = []

    if (utcHour >= SESSION_TIMINGS.asian.utcStart || utcHour < SESSION_TIMINGS.asian.utcEnd) {
      sessions.push('asia')
    }
    if (utcHour >= SESSION_TIMINGS.london.utcStart && utcHour < SESSION_TIMINGS.london.utcEnd) {
      sessions.push('london')
    }
    if (utcHour >= SESSION_TIMINGS.newyork.utcStart && utcHour < SESSION_TIMINGS.newyork.utcEnd) {
      sessions.push('newyork')
    }

    return sessions
  }

  /**
   * Get session display name and stats
   */
  getSessionInfo(session: TradingSession) {
    const sessionMap = {
      asia: { name: 'Asian', utcStart: 22, utcEnd: 6 },
      london: { name: 'London', utcStart: 7, utcEnd: 15 },
      newyork: { name: 'New York', utcStart: 12, utcEnd: 20 },
      overlap: { name: 'Overlap', utcStart: 12, utcEnd: 15 },
      closed: { name: 'Closed', utcStart: 0, utcEnd: 0 },
    }
    return sessionMap[session]
  }

  /**
   * Get holding time in minutes between entry and exit
   */
  getHoldingTimeMinutes(entryTime: Date | number, exitTime: Date | number): number {
    if (typeof entryTime === 'number') entryTime = new Date(entryTime)
    if (typeof exitTime === 'number') exitTime = new Date(exitTime)
    return differenceInMinutes(exitTime, entryTime)
  }

  /**
   * Categorize holding time into buckets
   */
  getHoldingTimeBucket(
    minutes: number,
  ): 'very-short' | 'short' | 'medium' | 'long' | 'very-long' {
    if (minutes < 5) return 'very-short'
    if (minutes < 15) return 'short'
    if (minutes < 60) return 'medium'
    if (minutes < 240) return 'long' // 4 hours
    return 'very-long'
  }

  /**
   * Check if a trade occurred near a major news time
   * Default window: 30 minutes before/after news
   */
  isNearNewsTime(utcDate: Date | number, windowMinutes: number = 30): boolean {
    if (typeof utcDate === 'number') {
      utcDate = new Date(utcDate)
    }

    const utcHour = utcDate.getUTCHours()
    const utcMin = utcDate.getUTCMinutes()
    const totalMinutes = utcHour * 60 + utcMin

    // Major news times in UTC (approximate)
    const newsTimesUTC = [
      { hour: 3, minute: 0, name: 'London News (Core Hours)' }, // 03:00 UTC
      { hour: 8, minute: 30, name: 'NY Data Release' }, // 08:30 UTC
      { hour: 13, minute: 0, name: 'Economic Events' }, // 13:00 UTC
    ]

    return newsTimesUTC.some((newsTime) => {
      const newsMinutes = newsTime.hour * 60 + newsTime.minute
      return Math.abs(totalMinutes - newsMinutes) <= windowMinutes
    })
  }

  /**
   * Get distance in time from now (e.g., "5 minutes ago", "in 2 hours")
   */
  getDistanceFromNow(date: Date | number): string {
    if (typeof date === 'number') {
      date = new Date(date)
    }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return this.format(date, 'MMM dd')
  }

  /**
   * Parse a date string in user's timezone
   */
  parseInUserTimezone(dateString: string, formatStr: string = 'MMM dd, yyyy'): Date {
    const parsed = parse(dateString, formatStr, new Date())
    return this.toUTC(parsed)
  }

  /**
   * Get start and end of day in user's timezone (returns UTC boundaries)
   */
  getDayBoundariesInUTC(dateInUserTz?: Date) {
    const userDate = dateInUserTz || toZonedTime(new Date(), this.userTimezone)
    const dayStart = startOfDay(userDate)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    return {
      start: this.toUTC(dayStart),
      end: this.toUTC(dayEnd),
    }
  }
}

// Export singleton instance (will be initialized with user's timezone on app load)
export const createTimeService = (timezone: string = 'UTC'): TimeService => {
  return new TimeService(timezone)
}
