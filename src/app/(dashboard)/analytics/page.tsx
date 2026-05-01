"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { getAnalyticsData } from "@/lib/actions/expense"
import { getCategories } from "@/lib/actions/category"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle, ListFilter,
  Zap, Target, Flame, Activity,
  ArrowUpRight, ArrowDownRight, ChevronDown, Check,
  CalendarDays, CalendarRange, Calendar as CalIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, startOfDay, endOfDay } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useDateRange } from "@/contexts/DateRangeContext"
import type { DateMode } from "@/contexts/DateRangeContext"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { dateRange, setDateRange, dateMode, setDateMode } = useDateRange()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [typeFilter, setTypeFilter] = useState<"EXPENSE" | "INCOME" | "ALL">("ALL")
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  // Close category dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    fetchData()
  }, [dateRange, selectedCategory, typeFilter])

  async function fetchData() {
    if (!dateRange?.from) return
    setLoading(true)
    const res = await getAnalyticsData({
      startDate: dateRange.from,
      endDate: dateRange.to || dateRange.from,
      categoryIds: selectedCategory === "all" ? [] : [selectedCategory],
      type: typeFilter
    })
    setData(res)
    setLoading(false)
  }

  // Totals from returned transactions
  const totals = useMemo(() => {
    if (!data?.transactions) return { income: 0, expense: 0, net: 0, count: 0 }
    const txs: any[] = data.transactions
    const income = txs.filter(t => t.type === "INCOME").reduce((s: number, t: any) => s + t.amount, 0)
    const expense = txs.filter(t => t.type === "EXPENSE").reduce((s: number, t: any) => s + t.amount, 0)
    return { income, expense, net: income - expense, count: txs.length }
  }, [data])

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === "all") return "All Categories"
    return categories.find(c => c.id === selectedCategory)?.name ?? "Category"
  }, [selectedCategory, categories])

  const insights = useMemo(() => {
    if (!data) return []
    const items: any[] = []
    const { savingsRate, burnRate, spikes, incomeTotal, expenseTotal } = data

    if (savingsRate > 20) {
      items.push({
        title: "High Efficiency",
        description: `You're saving ${savingsRate.toFixed(1)}% of your income. Exceptional discipline!`,
        icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10"
      })
    } else if (savingsRate < 5 && incomeTotal > 0) {
      items.push({
        title: "Low Savings Margin",
        description: `Your savings rate is only ${savingsRate.toFixed(1)}%. Consider reviewing fixed costs.`,
        icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10"
      })
    }
    if (expenseTotal > 0) {
      items.push({
        title: "Daily Burn Rate",
        description: `You're spending an average of ₹${burnRate.toLocaleString()} per day.`,
        icon: Flame, color: "text-amber-500", bg: "bg-amber-500/10"
      })
    }
    if (spikes && spikes.length > 0) {
      items.push({
        title: "Spending Volatility",
        description: `Detected ${spikes.length} unusual spending spikes in this period.`,
        icon: Activity, color: "text-primary", bg: "bg-primary/10"
      })
    }
    return items
  }, [data])

  // Date label for the picker button
  const dateSummary = useMemo(() => {
    if (!dateRange?.from) return "Pick a date"
    if (dateMode === "single") return format(dateRange.from, "MMM d, yyyy")
    if (dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()) {
      return `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
    }
    return format(dateRange.from, "MMM d, yyyy")
  }, [dateRange, dateMode])

  if (loading && !data) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Financial <span className="text-primary">Intelligence</span>
        </h1>
        <p className="text-muted-foreground mt-1">Deep dive into your financial habits and trends.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          {(["EXPENSE", "INCOME", "ALL"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                typeFilter === t ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Date mode toggle + picker */}
        <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
          {/* Single Day / Range toggle buttons */}
          <button
            onClick={() => {
              setDateMode("single")
              if (dateRange?.from) {
                const d = startOfDay(dateRange.from)
                setDateRange({ from: d, to: endOfDay(d) })
              }
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
            onClick={() => setDateMode("range")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              dateMode === "range" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            Range
          </button>

          {/* Calendar popover */}
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
                  selected={dateRange?.from}
                  onSelect={(d) => {
                    if (d) {
                      const day = startOfDay(d)
                      setDateRange({ from: day, to: endOfDay(d) })
                    }
                  }}
                  initialFocus
                  className="bg-background text-foreground"
                />
              ) : (
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({ from: startOfDay(range.from), to: range.to ? endOfDay(range.to) : undefined })
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

        {/* Category dropdown */}
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
                {[{ id: "all", name: "All Categories" }, ...categories].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setCatDropdownOpen(false) }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/10",
                      selectedCategory === cat.id ? "text-primary font-semibold" : "text-white"
                    )}
                  >
                    {cat.name}
                    {selectedCategory === cat.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Transactions Table */}
        <div className="lg:col-span-8">
          <Card className="glass-card border-white/5 overflow-hidden">
            <CardHeader className="bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-white">Filtered Transactions</CardTitle>
                  <CardDescription>
                    {loading
                      ? "Loading..."
                      : `${totals.count} transaction${totals.count !== 1 ? "s" : ""} · ${dateSummary}`}
                  </CardDescription>
                </div>
                {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-white/5">
                {!loading && totals.count === 0 ? (
                  <div className="text-center text-muted-foreground py-16">No transactions found.</div>
                ) : (
                  data?.transactions?.map((expense: any) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("shrink-0 p-2.5 rounded-xl", expense.type === "INCOME" ? "bg-emerald-500/15" : "bg-rose-500/15")}>
                          {expense.type === "INCOME"
                            ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                            : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{expense.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(expense.date), "MMM d, yyyy")}
                            </span>
                            <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-white/5 text-muted-foreground border border-white/5">
                              {expense.category.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={cn("font-black text-sm shrink-0", expense.type === "INCOME" ? "text-emerald-500" : "text-white")}>
                        {expense.type === "INCOME" ? "+" : "-"}₹{expense.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="w-[140px] text-muted-foreground uppercase text-[10px] font-black tracking-widest pl-8">Date</TableHead>
                      <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Description</TableHead>
                      <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Category</TableHead>
                      <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest text-right pr-8">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {totals.count === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-20">
                            No transactions found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data?.transactions?.map((expense: any) => (
                          <motion.tr
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={expense.id}
                            className="group border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <TableCell className="text-muted-foreground pl-8 py-4">
                              {format(new Date(expense.date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", expense.type === "INCOME" ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                                  {expense.type === "INCOME"
                                    ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                    : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
                                </div>
                                <span className="font-bold text-white group-hover:text-primary transition-colors">
                                  {expense.title}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-white/5 text-muted-foreground border border-white/5">
                                {expense.category.name}
                              </span>
                            </TableCell>
                            <TableCell className={cn("text-right font-black py-4 pr-8", expense.type === "INCOME" ? "text-emerald-500" : "text-white")}>
                              {expense.type === "INCOME" ? "+" : "-"}₹{expense.amount.toLocaleString('en-IN')}
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Totals footer */}
              {totals.count > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-8 py-4 bg-white/5 border-t border-white/5">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                    Total · {totals.count} transactions
                  </span>
                  <div className="flex items-center gap-4">
                    {totals.income > 0 && (
                      <span className="text-emerald-500 font-black">+₹{totals.income.toLocaleString('en-IN')}</span>
                    )}
                    {totals.expense > 0 && (
                      <span className="text-rose-500 font-black">-₹{totals.expense.toLocaleString('en-IN')}</span>
                    )}
                    <span className={cn("font-black border-l border-white/10 pl-4", totals.net >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      ₹{totals.net.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Smart Insights */}
          <Card className="glass border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-bold">Smart Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add more transactions to unlock insights.</p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {insights.map((insight, i) => (
                    <motion.div
                      key={insight.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn("p-4 rounded-2xl flex gap-4 items-start border border-white/5", insight.bg)}
                    >
                      <div className={cn("p-2.5 rounded-xl bg-background/40 shrink-0", insight.color)}>
                        <insight.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          {/* Filter Summary */}
          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Filter Summary</CardTitle>
              <CardDescription>Totals for the current selection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-muted-foreground font-medium">Income</span>
                <span className="text-emerald-500 font-black text-lg">₹{(data?.incomeTotal ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-muted-foreground font-medium">Expense</span>
                <span className="text-rose-500 font-black text-lg">₹{(data?.expenseTotal ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/10">
                <span className="text-white font-bold">Net Flow</span>
                <span className={cn("font-black text-lg", (data?.netTotal ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  ₹{(data?.netTotal ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
