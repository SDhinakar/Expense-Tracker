"use client"

import * as React from "react"
import { getDashboardAndAnalytics, revalidateDashboard } from "@/lib/actions/expense"
import { useSearchParams } from "next/navigation"

interface DashboardDataContextType {
  data: any
  loading: boolean
  refreshData: (force?: boolean) => Promise<void>
  optimisticUpdate: (updater: (prev: any) => any) => void
  cooldownActive: boolean
}

const DashboardDataContext = React.createContext<DashboardDataContextType | undefined>(undefined)

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()

  const typeParam = searchParams.get("type") || "ALL"
  const catParam = searchParams.get("category") || "all"
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [cooldownActive, setCooldownActive] = React.useState(false)

  const loadData = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await getDashboardAndAnalytics({
        fromStr: fromParam || undefined,
        toStr: toParam || undefined,
        categoryIds: catParam === "all" ? [] : [catParam],
        type: typeParam as any,
      })
      if (res) {
        setData(res)
      }
    } catch (error) {
      console.error("DashboardDataContext failed to fetch unified data:", error)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [fromParam, toParam, typeParam, catParam])

  // Initial load + background debouncing
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      loadData()
    }, 400)
    return () => clearTimeout(timeout)
  }, [loadData])

  // Background anti-stale & visibility revalidation every 60 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadData(true)
    }, 60000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData(true)
      }
    }

    window.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [loadData])

  const refreshData = React.useCallback(async (force = false) => {
    if (cooldownActive) return
    if (force) {
      setCooldownActive(true)
      setTimeout(() => setCooldownActive(false), 2500)
      await revalidateDashboard()
    }
    await loadData()
  }, [cooldownActive, loadData])

  const optimisticUpdate = React.useCallback((updater: (prev: any) => any) => {
    setData((prev: any) => {
      if (!prev) return prev
      return updater(prev)
    })
  }, [])

  const value = React.useMemo(() => ({
    data,
    loading,
    refreshData,
    optimisticUpdate,
    cooldownActive
  }), [data, loading, refreshData, optimisticUpdate, cooldownActive])

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  )
}

export function useDashboardData() {
  const context = React.useContext(DashboardDataContext)
  if (!context) {
    throw new Error("useDashboardData must be used within a DashboardDataProvider")
  }
  return context
}
