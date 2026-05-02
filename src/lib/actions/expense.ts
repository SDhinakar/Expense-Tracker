"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { TransactionType, SplitType } from "@prisma/client"

export async function getExpenses(range?: { from?: Date; to?: Date }) {
  const session = await auth()
  if (!session?.user?.id) return []

  return await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      ...(range?.from || range?.to
        ? {
            date: {
              ...(range.from ? { gte: range.from } : {}),
              ...(range.to ? { lte: range.to } : {}),
            },
          }
        : {}),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  })
}

export async function createExpense(data: {
  title: string
  amount: number
  categoryId: string
  type: TransactionType
  date: Date
  notes?: string
  splitType?: SplitType
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const expense = await prisma.expense.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  return expense
}

export async function getDashboardData(range?: { from: Date; to: Date }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { balance: 0, income: 0, expense: 0, recentTransactions: [], activeGroups: 3, monthlyIncome: 0, monthlyExpense: 0, savingsRate: 0, dailyAggregation: [] }

    const userId = session.user.id
    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const queryStart = range?.from || startOfThisMonth
    const queryEnd = range?.to || now

    const dateFilter = { gte: queryStart, lte: queryEnd }

    // ─── Parallelise all 5 queries (was sequential = ~5 s each page load) ───
    const [user, expenses, lifetimeTotals, periodTotals, dailyTransactions] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { activeGroups: true },
        }),

        // Recent 5 transactions (lifetime, for the feed card)
        prisma.expense.findMany({
          where: { userId },
          include: { category: true },
          orderBy: { date: "desc" },
          take: 5,
        }),

        // Lifetime income/expense for the balance card
        prisma.expense.groupBy({
          by: ["type"],
          where: { userId },
          _sum: { amount: true },
        }),

        // Period income/expense for the selected range
        prisma.expense.groupBy({
          by: ["type"],
          where: { userId, date: dateFilter },
          _sum: { amount: true },
        }),

        // Daily chart data — only date/amount/type needed, skip category join
        prisma.expense.findMany({
          where: { userId, date: dateFilter },
          select: { date: true, amount: true, type: true },
          orderBy: { date: "asc" },
        }),
      ])

    const totalIncome = lifetimeTotals.find(t => t.type === "INCOME")?._sum.amount ?? 0
    const totalExpense = lifetimeTotals.find(t => t.type === "EXPENSE")?._sum.amount ?? 0
    const balance = totalIncome - totalExpense

    const monthlyIncome = periodTotals.find(t => t.type === "INCOME")?._sum.amount ?? 0
    const monthlyExpense = periodTotals.find(t => t.type === "EXPENSE")?._sum.amount ?? 0
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0

    const dailyDataMap: Record<string, number> = {}
    for (const t of dailyTransactions) {
      if (t.type !== "EXPENSE") continue
      const day = t.date.toISOString().split("T")[0]
      dailyDataMap[day] = (dailyDataMap[day] ?? 0) + t.amount
    }
    const dailyAggregation = Object.entries(dailyDataMap).map(([date, total]) => ({
      name: format(new Date(date), "MMM d"),
      total,
    }))

    return {
      balance,
      income: totalIncome,
      expense: totalExpense,
      monthlyIncome,
      monthlyExpense,
      savingsRate,
      dailyAggregation,
      recentTransactions: expenses,
      activeGroups: user?.activeGroups ?? 3,
    }
  } catch (err) {
    console.error("Dashboard Server Action Error:", err)
    return {
      balance: 0, income: 0, expense: 0,
      recentTransactions: [], activeGroups: 3,
      monthlyIncome: 0, monthlyExpense: 0,
      savingsRate: 0, dailyAggregation: [],
    }
  }
}

export async function updateActiveGroups(count: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeGroups: count },
  })

  revalidatePath("/dashboard")
}

export async function updateExpense(id: string, data: {
  title: string
  amount: number
  categoryId: string
  type: TransactionType
  date: Date
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.expense.update({
    where: { id, userId: session.user.id },
    data,
  })

  revalidatePath("/dashboard")
  revalidatePath("/transactions")
}

export async function deleteExpense(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // deleteMany never throws P2025 if record not found (safe for optimistic UI)
  await prisma.expense.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidatePath("/dashboard")
  revalidatePath("/transactions")
}

export async function getAnalyticsData(filters: {
  startDate?: Date,
  endDate?: Date,
  categoryIds?: string[],
  type?: TransactionType | "ALL"
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { startDate, endDate, categoryIds, type } = filters
  const userId = session.user.id

  const whereClause: any = {
    userId,
    date: { gte: startDate, lte: endDate },
  }
  if (categoryIds && categoryIds.length > 0) whereClause.categoryId = { in: categoryIds }
  if (type && type !== "ALL") whereClause.type = type

  // Previous period date range (computed before queries so it's available for Promise.all)
  const prevPeriodWhere =
    startDate && endDate
      ? (() => {
          const duration = endDate.getTime() - startDate.getTime()
          return {
            userId,
            type: "EXPENSE" as const,
            date: {
              gte: new Date(startDate.getTime() - duration),
              lte: new Date(endDate.getTime() - duration),
            },
          }
        })()
      : null

  // ─── Parallelise all 3 independent DB queries ───
  const [transactions, userBudgets, prevTotals] = await Promise.all([
    prisma.expense.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.budget.findMany({ where: { userId } }),
    prevPeriodWhere
      ? prisma.expense.aggregate({ where: prevPeriodWhere, _sum: { amount: true } })
      : Promise.resolve({ _sum: { amount: null } }),
  ])

  const incomeTotal = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0)
  const expenseTotal = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0)
  const netTotal = incomeTotal - expenseTotal
  const savingsRate = incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0

  const dailyTotals = transactions.reduce((acc: any, t) => {
    const day = t.date.toISOString().split("T")[0]
    if (!acc[day]) acc[day] = { date: day, income: 0, expense: 0, total: 0 }
    if (t.type === "INCOME") acc[day].income += t.amount
    else acc[day].expense += t.amount
    acc[day].total = acc[day].income - acc[day].expense
    return acc
  }, {})
  const dailyArray = Object.values(dailyTotals) as any[]

  const daysCount =
    startDate && endDate
      ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000))
      : dailyArray.length || 1
  const burnRate = expenseTotal / daysCount

  const categoryBreakdown = transactions.reduce((acc: any, t) => {
    if (t.type !== "EXPENSE") return acc
    const catName = t.category.name
    if (!acc[catName]) {
      const budget = userBudgets.find(b => b.categoryId === t.category.id)
      acc[catName] = {
        id: t.category.id,
        name: catName,
        value: 0,
        color: t.category.color,
        budgetLimit: budget?.amount ?? 5000,
      }
    }
    acc[catName].value += t.amount
    return acc
  }, {})

  const avgExpense = expenseTotal / (dailyArray.length || 1)
  const spikes = dailyArray.filter(d => d.expense > avgExpense * 1.8)

  let bucketedData: any[] = []
  if (daysCount <= 31) {
    bucketedData = dailyArray.map(d => ({ name: format(new Date(d.date), "MMM d"), ...d }))
  } else if (daysCount <= 92) {
    const weeks: any = {}
    for (const t of transactions) {
      const weekKey = `Week ${Math.ceil(t.date.getDate() / 7)}`
      if (!weeks[weekKey]) weeks[weekKey] = { name: weekKey, income: 0, expense: 0, total: 0 }
      if (t.type === "INCOME") weeks[weekKey].income += t.amount
      else weeks[weekKey].expense += t.amount
      weeks[weekKey].total = weeks[weekKey].income - weeks[weekKey].expense
    }
    bucketedData = Object.values(weeks)
  } else {
    const months: any = {}
    for (const t of transactions) {
      const monthKey = t.date.toLocaleString("default", { month: "short" })
      if (!months[monthKey]) months[monthKey] = { name: monthKey, income: 0, expense: 0, total: 0 }
      if (t.type === "INCOME") months[monthKey].income += t.amount
      else months[monthKey].expense += t.amount
      months[monthKey].total = months[monthKey].income - months[monthKey].expense
    }
    bucketedData = Object.values(months)
  }

  return {
    incomeTotal,
    expenseTotal,
    netTotal,
    savingsRate,
    burnRate,
    categoryBreakdown: Object.values(categoryBreakdown),
    bucketedData,
    spikes,
    daysCount,
    transactions,
    previousTotalExpense: prevTotals._sum.amount ?? 0,
  }
}
