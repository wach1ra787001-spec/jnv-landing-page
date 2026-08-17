/**
 * cTrader Integration Error Handling & Logging Utilities
 */

export enum CTraderErrorCode {
  MISSING_ENV_VARS = 'MISSING_ENV_VARS',
  INVALID_STATE = 'INVALID_STATE',
  TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED',
  ACCOUNTS_FETCH_FAILED = 'ACCOUNTS_FETCH_FAILED',
  NO_ACCOUNTS = 'NO_ACCOUNTS',
  SYNC_FAILED = 'SYNC_FAILED',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  UNKNOWN = 'UNKNOWN',
}

export interface CTraderError {
  code: CTraderErrorCode
  message: string
  details?: Record<string, any>
  timestamp: string
}

export class CTraderIntegrationError extends Error {
  code: CTraderErrorCode
  details?: Record<string, any>

  constructor(code: CTraderErrorCode, message: string, details?: Record<string, any>) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'CTraderIntegrationError'
  }

  toJSON(): CTraderError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Log cTrader integration events for debugging and monitoring
 */
export function logCTraderEvent(
  event: string,
  data?: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [cTrader] [${level.toUpperCase()}] ${event}`

  if (level === 'error') {
    console.error(logMessage, data)
  } else if (level === 'warn') {
    console.warn(logMessage, data)
  } else {
    console.log(logMessage, data)
  }

  // Could send to external logging service here (e.g., Sentry, DataDog)
  // Example: sendToLoggingService({ event, data, level, timestamp })
}

/**
 * Validate required environment variables for cTrader integration
 */
export function validateCTraderEnvVars(): { valid: boolean; missing: string[] } {
  const required = [
    'CTRADER_AUTH_URL',
    'CTRADER_TOKEN_URL',
    'CTRADER_API_BASE',
    'CTRADER_CLIENT_ID',
    'CTRADER_CLIENT_SECRET',
    'CTRADER_REDIRECT_URI',
  ]

  const missing = required.filter((key) => !process.env[key])

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Format cTrader error for API responses
 */
export function formatCTraderErrorResponse(error: unknown) {
  if (error instanceof CTraderIntegrationError) {
    return {
      error: error.code,
      message: error.message,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    return {
      error: CTraderErrorCode.UNKNOWN,
      message: error.message,
    }
  }

  return {
    error: CTraderErrorCode.UNKNOWN,
    message: 'An unknown error occurred',
  }
}

/**
 * User-friendly error messages for UI
 */
export function getCTraderErrorMessage(code: CTraderErrorCode): string {
  const messages: Record<CTraderErrorCode, string> = {
    [CTraderErrorCode.MISSING_ENV_VARS]: 'cTrader integration is not properly configured. Please contact support.',
    [CTraderErrorCode.INVALID_STATE]: 'Security validation failed. Please try connecting again.',
    [CTraderErrorCode.TOKEN_EXCHANGE_FAILED]: 'Failed to authenticate with cTrader. Please try again.',
    [CTraderErrorCode.ACCOUNTS_FETCH_FAILED]: 'Could not retrieve your cTrader accounts. Please try again.',
    [CTraderErrorCode.NO_ACCOUNTS]: 'No cTrader accounts found. Please connect at least one account.',
    [CTraderErrorCode.SYNC_FAILED]: 'Failed to sync trades. Please try again or contact support.',
    [CTraderErrorCode.TOKEN_REFRESH_FAILED]: 'Your cTrader session has expired. Please reconnect.',
    [CTraderErrorCode.UNAUTHORIZED]: 'Not authorized. Please log in again.',
    [CTraderErrorCode.NOT_CONNECTED]: 'cTrader account is not connected. Please connect first.',
    [CTraderErrorCode.UNKNOWN]: 'An unexpected error occurred. Please try again.',
  }

  return messages[code]
}
