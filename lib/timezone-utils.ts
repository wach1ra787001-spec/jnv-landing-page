/**
 * Timezone Detection Utility
 * Detects user's timezone from browser/device
 */

/**
 * Get user's timezone from browser (Intl API)
 * Returns IANA timezone identifier (e.g., 'America/New_York')
 */
export function detectUserTimezone(): string {
  try {
    // Modern approach using Intl API
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return timezone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * Verify if a timezone string is valid IANA format
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Get list of all available IANA timezones
 * Returns common timezones organized by region
 */
export const COMMON_TIMEZONES = {
  'UTC/GMT': [
    'UTC',
    'GMT',
  ],
  'Africa': [
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Nairobi',
  ],
  'Asia': [
    'Asia/Bangkok',
    'Asia/Dubai',
    'Asia/Hong_Kong',
    'Asia/Jakarta',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Tokyo',
  ],
  'Europe': [
    'Europe/Amsterdam',
    'Europe/Berlin',
    'Europe/London',
    'Europe/Paris',
    'Europe/Moscow',
    'Europe/Zurich',
  ],
  'America': [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Mexico_City',
    'America/Buenos_Aires',
  ],
  'Australia': [
    'Australia/Brisbane',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Perth',
  ],
  'Pacific': [
    'Pacific/Auckland',
    'Pacific/Fiji',
    'Pacific/Honolulu',
    'Pacific/Singapore',
  ],
}

/**
 * Flatten timezone list for dropdowns
 */
export function getFlatTimezoneList(): string[] {
  return Object.values(COMMON_TIMEZONES).flat().sort()
}

/**
 * Get timezone display name (e.g., "America/New_York" → "New York, USA")
 */
export function getTimezoneDisplayName(timezone: string): string {
  const parts = timezone.split('/')
  if (parts.length === 2) {
    return `${parts[1].replace(/_/g, ' ')}, ${parts[0]}`
  }
  return timezone
}

/**
 * Estimate timezone from country code (simplified)
 * Not always accurate but provides fallback
 */
export function timezoneFromCountryCode(countryCode: string): string | null {
  const countryTimezones: Record<string, string> = {
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'JP': 'Asia/Tokyo',
    'SG': 'Asia/Singapore',
    'AE': 'Asia/Dubai',
    'HK': 'Asia/Hong_Kong',
    'AU': 'Australia/Sydney',
    'NZ': 'Pacific/Auckland',
    'IN': 'Asia/Kolkata',
    'CN': 'Asia/Shanghai',
    'DE': 'Europe/Berlin',
    'FR': 'Europe/Paris',
    'CA': 'America/Toronto',
    'MX': 'America/Mexico_City',
    'BR': 'America/Sao_Paulo',
    'ZA': 'Africa/Johannesburg',
    'NG': 'Africa/Lagos',
    'KE': 'Africa/Nairobi',
  }
  return countryTimezones[countryCode] || null
}
