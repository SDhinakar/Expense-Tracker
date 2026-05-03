"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ListFilter, ChevronDown, Check, CalendarDays, CalendarRange, Calendar as CalIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface FiltersBarProps {
  categories: any[]
}

export function FiltersBar({ categories }: FiltersBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const typeFilter = searchParams.get("type") || "ALL"
  const catFilter = searchParams.get("category") || "all"
  const dateMode = searchParams.get("dateMode") || "range"
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const [catDropdownOpen, setCatDropdownOpen] = React.useState(false)
  const catRef = React.useRef<HTMLDivElement>(null)

  // Default dates if none in URL
  const defaultFrom = React.useMemo(() => {
    if (fromParam) return new Date(fromParam)
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }, [fromParam])

  const defaultTo = React.useMemo(() => {
    if (toParam) return new Date(toParam)
    return new Date()
  }, [toParam])

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function updateParams(newParams: { [key: string]: string | null }) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) params.delete(key)
      else params.set(key, value)
    })
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const selectedCategoryName = React.useMemo(() => {
    if (catFilter === "all") return "All Categories"
    return categories.find(c => c.id === catFilter)?.name ?? "Category"
  }, [catFilter, categories])

  const dateSummary = React.useMemo(() => {
    if (dateMode === "single") return format(defaultFrom, "MMM d, yyyy")
    return `${format(defaultFrom, "MMM d")} – ${format(defaultTo, "MMM d, yyyy")}`
  }, [defaultFrom, defaultTo, dateMode])

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type Toggle */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
        {(["EXPENSE", "INCOME", "ALL"] as const).map((t) => (
          <button
            key={t}
            onClick={() => updateParams({ type: t })}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
              typeFilter === t ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Date Toggle Mode + Calendar Popover */}
      <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
        <button
          onClick={() => {
            const day = startOfDay(defaultFrom)
            updateParams({
              dateMode: "single",
              from: day.toISOString(),
              to: endOfDay(day).toISOString(),
            })
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            dateMode === "single" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
          )}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Day
        </button>

        <button
          onClick={() => updateParams({ dateMode: "range" })}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            dateMode === "range" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
          )}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          Range
        </button>

        {/* Dynamic calendar popover */}
        <Popover>
          <PopoverTrigger
            render={
              <button className="flex items-center gap-2 h-8 px-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-all">
                <CalIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="max-w-[160px] truncate font-medium">{dateSummary}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            }
          />
          <PopoverContent className="w-auto p-0 glass border-white/10" align="start">
            {dateMode === "single" ? (
              <Calendar
                mode="single"
                selected={defaultFrom}
                onSelect={(d) => {
                  if (d) {
                    const day = startOfDay(d)
                    updateParams({ from: day.toISOString(), to: endOfDay(day).toISOString() })
                  }
                }}
                initialFocus
                className="bg-background text-foreground"
              />
            ) : (
              <Calendar
                mode="range"
                selected={{ from: defaultFrom, to: defaultTo }}
                onSelect={(range) => {
                  if (range?.from) {
                    updateParams({
                      from: startOfDay(range.from).toISOString(),
                      to: range.to ? endOfDay(range.to).toISOString() : null,
                    })
                  }
                }}
                numberOfMonths={1}
                initialFocus
                className="bg-background text-foreground"
              />
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Category Dropdown Selection */}
      <div className="relative" ref={catRef}>
        <button
          onClick={() => setCatDropdownOpen(v => !v)}
          className="flex items-center gap-2 h-11 px-4 glass border-white/5 rounded-xl text-sm text-white hover:bg-white/10 transition-all"
        >
          <ListFilter className="w-4 h-4 text-primary" />
          <span className="max-w-[110px] truncate">{selectedCategoryName}</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", catDropdownOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {catDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 z-50 w-52 glass border border-white/10 rounded-xl overflow-hidden shadow-2xl"
            >
              {[{ id: "all", name: "All Categories" }, ...categories].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    updateParams({ category: cat.id === "all" ? null : cat.id })
                    setCatDropdownOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/10",
                    catFilter === cat.id ? "text-primary font-semibold" : "text-white"
                  )}
                >
                  {cat.name}
                  {catFilter === cat.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
