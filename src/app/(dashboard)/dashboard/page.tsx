"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OverviewChart } from "@/components/dashboard/OverviewChart"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import Link from "next/link"
import { ArrowDownIcon, ArrowUpIcon, Wallet, TrendingUp, TrendingDown, PieChart } from "lucide-react"
import { getDashboardData } from "@/lib/actions/expense"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useDateRange } from "@/contexts/DateRangeContext"
import { Loader } from "@/components/ui/loader"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export default function DashboardPage() {
  const [data, setData] = useState<{
    balance: number
    income: number
    expense: number
    monthlyIncome: number
    monthlyExpense: number
    savingsRate: number
    recentTransactions: any[]
    activeGroups: number
    dailyAggregation: any[]
  } | null>(null)

  const { dateRange, setDateRange } = useDateRange()

  useEffect(() => {
    if (dateRange?.from) {
      getDashboardData({
        from: dateRange.from,
        to: dateRange.to || dateRange.from
      }).then((res) => {
        setData(res as any)
      })
    }
  }, [dateRange])

  if (!data) return <Loader />

  const { balance, income, expense, monthlyIncome, monthlyExpense, savingsRate, dailyAggregation, recentTransactions } = data

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            Financial <span className="text-primary">Intelligence</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Welcome back. Here&apos;s your financial pulse today.</p>
        </div>
        <div className="self-start sm:self-center shrink-0">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      {/* Stat Cards — Balance spans full width, then 3 equal cols below on sm+ */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {/* Total Balance — full width on xs, 2 cols on sm */}
        <motion.div variants={item} className="col-span-2 sm:col-span-2 lg:col-span-1">
          <Card className="glass-card premium-border relative overflow-hidden group h-full">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Balance</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">₹{balance.toLocaleString('en-IN')}</div>
              <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "70%" }}
                  className="h-full bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Income */}
        <motion.div variants={item} className="col-span-1 sm:col-span-1 lg:col-span-1">
          <Card className="glass-card premium-border group h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-500">+₹{monthlyIncome.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">Total: ₹{income.toLocaleString()}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Expenses */}
        <motion.div variants={item} className="col-span-1 sm:col-span-1 lg:col-span-1">
          <Card className="glass-card premium-border group h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expense</CardTitle>
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <ArrowDownIcon className="h-4 w-4 text-rose-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-rose-500">-₹{monthlyExpense.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="truncate">Total: ₹{expense.toLocaleString()}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings Rate */}
        <motion.div variants={item} className="col-span-2 sm:col-span-2 lg:col-span-1">
          <Card className="glass-card premium-border group h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Savings</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <PieChart className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-500">{savingsRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-2">Monthly efficiency</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-7">
        <motion.div variants={item} className="lg:col-span-4">
          <Card className="glass-card border-white/5 overflow-hidden">
            <CardHeader className="bg-white/5 pb-4">
              <CardTitle className="text-lg font-bold text-white">Cash Flow Insights</CardTitle>
              <CardDescription className="text-muted-foreground">Daily expense trend for selected period.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <OverviewChart data={dailyAggregation} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-3">
          <Card className="glass-card border-white/5 overflow-hidden h-full">
            <CardHeader className="bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-muted-foreground">Latest transactions.</CardDescription>
                </div>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <RecentTransactions transactions={recentTransactions} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
