'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { TimeService } from '@/lib/services/time-service'
import { detectUserTimezone } from '@/lib/timezone-utils'

interface TimezoneContextType {
  timeService: TimeService
  userTimezone: string
  setUserTimezone: (timezone: string) => void
  isLoading: boolean
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

interface TimezoneProviderProps {
  children: React.ReactNode
  initialTimezone?: string
}

export function TimezoneProvider({ children, initialTimezone }: TimezoneProviderProps) {
  const [userTimezone, setUserTimezoneState] = useState<string>(initialTimezone || 'UTC')
  const [isLoading, setIsLoading] = useState(true)
  const [timeService] = useState(() => new TimeService(initialTimezone || 'UTC'))

  // Initialize timezone on mount
  useEffect(() => {
    if (!initialTimezone) {
      // Detect timezone from browser
      const detected = detectUserTimezone()
      setUserTimezoneState(detected)
      timeService.setTimezone(detected)
    }
    setIsLoading(false)
  }, [initialTimezone, timeService])

  const setUserTimezone = useCallback((timezone: string) => {
    setUserTimezoneState(timezone)
    timeService.setTimezone(timezone)
  }, [timeService])

  const value: TimezoneContextType = {
    timeService,
    userTimezone,
    setUserTimezone,
    isLoading,
  }

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>
}

/**
 * Hook to use the TimeService from anywhere in the app
 */
export function useTimezone() {
  const context = useContext(TimezoneContext)
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider')
  }
  return context
}

/**
 * Hook to get just the TimeService
 */
export function useTimeService() {
  return useTimezone().timeService
}
