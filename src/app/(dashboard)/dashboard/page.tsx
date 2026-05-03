"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Wallet, ArrowUpIcon, ArrowDownIcon, PieChart, RefreshCw } from "lucide-react"
import { useDashboardData } from "@/context/DashboardDataContext"
import { getCategories } from "@/lib/actions/category"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FiltersBar } from "@/components/dashboard/FiltersBar"
import { TransactionsTable } from "@/components/dashboard/TransactionsTable"
import { InsightsCard } from "@/components/dashboard/InsightsCard"
import { FilterSummary } from "@/components/dashboard/FilterSummary"
import { Loader } from "@/components/ui/loader"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
}

const MemoizedFiltersBar = React.memo(FiltersBar)
const MemoizedTransactionsTable = React.memo(TransactionsTable)
const MemoizedInsightsCard = React.memo(InsightsCard)
const MemoizedFilterSummary = React.memo(FilterSummary)

export default function DashboardPage() {
  const { data, loading, refreshData, cooldownActive } = useDashboardData()
  const [categories, setCategories] = React.useState<any[]>([])

  React.useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  const dynamicInsights = React.useMemo(() => {
    if (!data) return []
    const items: any[] = []
    const { savingsRate: fRate = 0, burnRate = 0, spikes = [], incomeTotal = 0, expenseTotal = 0 } = data

    if (fRate > 20) {
      items.push({
        title: "High Efficiency",
        description: `You're saving ${fRate.toFixed(1)}% of your income. Exceptional discipline!`,
        icon: "Target", color: "text-emerald-500", bg: "bg-emerald-500/10"
      })
    } else if (fRate < 5 && incomeTotal > 0) {
      items.push({
        title: "Low Savings Margin",
        description: `Your savings rate is only ${fRate.toFixed(1)}%. Review fixed or recurring costs.`,
        icon: "AlertCircle", color: "text-rose-500", bg: "bg-rose-500/10"
      })
    }
    if (expenseTotal > 0) {
      items.push({
        title: "Daily Burn Rate",
        description: `Your average spending in this period is ₹${burnRate.toLocaleString("en-IN")} per day.`,
        icon: "Flame", color: "text-amber-500", bg: "bg-amber-500/10"
      })
    }
    if (spikes && spikes.length > 0) {
      items.push({
        title: "Spending Volatility",
        description: `Detected ${spikes.length} unusual spending spikes in this period.`,
        icon: "Activity", color: "text-primary", bg: "bg-primary/10"
      })
    }
    return items
  }, [data])

  if (loading && !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader inline />
      </div>
    )
  }

  const { balance = 0, income = 0, expense = 0, incomeTotal = 0, expenseTotal = 0, netTotal = 0, savingsRate = 0, updatedAt } = data || {}
  const overallSavingsRate = income > 0 ? ((income - expense) / income) * 100 : 0
  const monthlyBalance = incomeTotal - expenseTotal

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Financial <span className="text-primary">Intelligence</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            One unified control room for all your financial pulse and analytics.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {updatedAt && (
            <span className="text-[10px] font-bold text-muted-foreground bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Updated: {new Date(updatedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={() => refreshData(true)}
            disabled={loading || cooldownActive}
            size="sm"
            className="gap-1.5 h-9 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 transition-all font-bold px-3 text-xs"
          >
            <RefreshCw className={loading ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
            {cooldownActive ? "Cooldown..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <motion.div variants={item} className="col-span-2 sm:col-span-2 lg:col-span-1">
          <Card className="glass-card premium-border relative overflow-hidden group h-full">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Balance</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl lg:text-3xl font-extrabold text-white">₹{balance.toLocaleString("en-IN")}</div>
              <p className="text-[11px] font-bold text-muted-foreground mt-1 tracking-wide uppercase">
                Month flow: <span className={monthlyBalance >= 0 ? "text-emerald-400" : "text-rose-400"}>₹{monthlyBalance.toLocaleString("en-IN")}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="col-span-1 sm:col-span-1 lg:col-span-1">
          <Card className="glass-card premium-border group h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Income</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-extrabold text-emerald-500">+₹{income.toLocaleString("en-IN")}</div>
              <p className="text-[11px] font-bold text-muted-foreground mt-1 tracking-wide uppercase truncate">
                Month total: <span className="text-emerald-400">+₹{incomeTotal.toLocaleString("en-IN")}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="col-span-1 sm:col-span-1 lg:col-span-1">
          <Card className="glass-card premium-border group h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expense</CardTitle>
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <ArrowDownIcon className="h-4 w-4 text-rose-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-extrabold text-rose-500">-₹{expense.toLocaleString("en-IN")}</div>
              <p className="text-[11px] font-bold text-muted-foreground mt-1 tracking-wide uppercase truncate">
                Month total: <span className="text-rose-400">-₹{expenseTotal.toLocaleString("en-IN")}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="col-span-2 sm:col-span-2 lg:col-span-1">
          <Card className="glass-card premium-border group h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Savings</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <PieChart className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl lg:text-3xl font-extrabold text-blue-500">{overallSavingsRate.toFixed(1)}%</div>
              <p className="text-[11px] font-bold text-muted-foreground mt-1 tracking-wide uppercase truncate">
                Month efficiency: <span className="text-blue-400">{savingsRate.toFixed(1)}%</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item} className="space-y-6">
        <MemoizedFiltersBar categories={categories} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="glass-card border-white/5 overflow-hidden">
              <CardHeader className="bg-white/5 flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Filtered Transactions</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Viewing {data?.transactions?.length || 0} transaction{(data?.transactions?.length !== 1) ? "s" : ""}
                  </p>
                </div>
                {loading && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin shrink-0" />
                    <span className="text-xs font-black text-primary tracking-wide uppercase animate-pulse">Updating...</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <MemoizedTransactionsTable transactions={data?.transactions || []} loading={loading} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
            <MemoizedInsightsCard insights={dynamicInsights} loading={loading} />
            <MemoizedFilterSummary
              incomeTotal={incomeTotal}
              expenseTotal={expenseTotal}
              netTotal={netTotal}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
