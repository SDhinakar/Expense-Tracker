"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"

export type DateMode = "single" | "range"

interface DateRangeContextType {
  /** The effective date range sent to all API calls */
  dateRange: DateRange | undefined
  /** The active display mode — shared across all pages */
  dateMode: DateMode
  /** Update the range (also saves both range + single internally based on mode) */
  setDateRange: (range: DateRange | undefined) => void
  /** Switch modes — automatically restores the last saved date for that mode */
  setDateMode: (mode: DateMode) => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

// sessionStorage keys
const KEY_MODE   = "app-date-mode"
const KEY_RANGE  = "app-date-range"
const KEY_SINGLE = "app-date-single"

function readSession<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeSession(key: string, value: unknown) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(key, JSON.stringify(value))
}

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const today = new Date()

  // Defaults for fresh session
  const defaultMode: DateMode = "range"
  const defaultRange: DateRange = {
    from: startOfMonth(today),
    to: endOfMonth(today)
  }
  const defaultSingle: DateRange = {
    from: startOfDay(today),
    to: endOfDay(today)
  }

  const [dateMode, setDateModeState] = useState<DateMode>(defaultMode)
  // rangeStore: saved dates for "range" mode
  const [rangeStore, setRangeStore] = useState<DateRange>(defaultRange)
  // singleStore: saved dates for "single" mode
  const [singleStore, setSingleStore] = useState<DateRange>(defaultSingle)

  // Restore from sessionStorage on mount
  useEffect(() => {
    const savedMode = readSession<DateMode>(KEY_MODE, defaultMode)

    const rawRange = readSession<{ from?: string; to?: string } | null>(KEY_RANGE, null)
    const restoredRange: DateRange = rawRange
      ? {
          from: rawRange.from ? new Date(rawRange.from) : defaultRange.from,
          to:   rawRange.to   ? new Date(rawRange.to)   : defaultRange.to
        }
      : defaultRange

    const rawSingle = readSession<{ from?: string; to?: string } | null>(KEY_SINGLE, null)
    const restoredSingle: DateRange = rawSingle
      ? {
          from: rawSingle.from ? new Date(rawSingle.from) : defaultSingle.from,
          to:   rawSingle.to   ? new Date(rawSingle.to)   : defaultSingle.to
        }
      : defaultSingle

    setDateModeState(savedMode)
    setRangeStore(restoredRange)
    setSingleStore(restoredSingle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** The effective range used by pages and APIs */
  const dateRange: DateRange = dateMode === "single" ? singleStore : rangeStore

  /** Update dates within the current mode */
  const setDateRange = useCallback((range: DateRange | undefined) => {
    if (!range) return
    if (dateMode === "single") {
      setSingleStore(range)
      writeSession(KEY_SINGLE, range)
    } else {
      setRangeStore(range)
      writeSession(KEY_RANGE, range)
    }
  }, [dateMode])

  /** Switch between single/range — restores last saved date for that mode */
  const setDateMode = useCallback((mode: DateMode) => {
    setDateModeState(mode)
    writeSession(KEY_MODE, mode)
    // When switching to range, make sure rangeStore is up to date in session
    // (no change needed — just the mode switches which store is "live")
  }, [])

  return (
    <DateRangeContext.Provider value={{ dateRange, dateMode, setDateRange, setDateMode }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const context = useContext(DateRangeContext)
  if (context === undefined) {
    throw new Error("useDateRange must be used within a DateRangeProvider")
  }
  return context
}
