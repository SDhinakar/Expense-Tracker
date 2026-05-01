"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { TransactionType, SplitType } from "@prisma/client"

export async function getExpenses() {
  const session = await auth()
  if (!session?.user?.id) return []

  return await prisma.expense.findMany({
    where: { userId: session.user.id },
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeGroups: true }
    })

    // Recent transactions (always lifetime)
    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5
    })

    // Lifetime Totals (for Balance)
    const lifetimeTotals = await prisma.expense.groupBy({
      by: ["type"],
      where: { userId },
      _sum: { amount: true }
    })

    const totalIncome = lifetimeTotals.find(t => t.type === "INCOME")?._sum.amount || 0
    const totalExpense = lifetimeTotals.find(t => t.type === "EXPENSE")?._sum.amount || 0
    const balance = totalIncome - totalExpense

    // Period Totals
    const periodTotals = await prisma.expense.groupBy({
      by: ["type"],
      where: { 
        userId,
        date: { 
          gte: queryStart,
          lte: queryEnd
        }
      },
      _sum: { amount: true }
    })

    const monthlyIncome = periodTotals.find(t => t.type === "INCOME")?._sum.amount || 0
    const monthlyExpense = periodTotals.find(t => t.type === "EXPENSE")?._sum.amount || 0
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0

    // Daily aggregation for the chart
    const dailyTransactions = await prisma.expense.findMany({
      where: { 
        userId,
        date: { 
          gte: queryStart,
          lte: queryEnd
        }
      },
      orderBy: { date: "asc" }
    })

    const dailyDataMap: any = {}
    dailyTransactions.forEach(t => {
      const day = t.date.toISOString().split('T')[0]
      if (!dailyDataMap[day]) dailyDataMap[day] = 0
      if (t.type === "EXPENSE") dailyDataMap[day] += t.amount
    })

    const dailyAggregation = Object.keys(dailyDataMap).map(date => ({
      name: format(new Date(date), "MMM d"),
      total: dailyDataMap[date]
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
      activeGroups: user?.activeGroups || 3
    }
  } catch (err) {
    console.error("Dashboard Server Action Error:", err)
    return {
      balance: 0,
      income: 0,
      expense: 0,
      recentTransactions: [],
      activeGroups: 3,
      monthlyIncome: 0,
      monthlyExpense: 0,
      savingsRate: 0,
      dailyAggregation: []
    }
  }
}

export async function updateActiveGroups(count: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeGroups: count }
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
    data
  })

  revalidatePath("/dashboard")
  revalidatePath("/transactions")
}

export async function deleteExpense(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.expense.delete({
    where: {
      id,
      userId: session.user.id
    }
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
    date: {
      gte: startDate,
      lte: endDate
    }
  }

  if (categoryIds && categoryIds.length > 0) {
    whereClause.categoryId = { in: categoryIds }
  }

  if (type && type !== "ALL") {
    whereClause.type = type
  }

  const transactions = await prisma.expense.findMany({
    where: whereClause,
    include: { category: true },
    orderBy: { date: "asc" }
  })

  const incomeTotal = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0)
  const expenseTotal = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0)
  const netTotal = incomeTotal - expenseTotal
  const savingsRate = incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0

  const dailyTotals = transactions.reduce((acc: any, t) => {
    const day = t.date.toISOString().split('T')[0]
    if (!acc[day]) acc[day] = { date: day, income: 0, expense: 0, total: 0 }
    if (t.type === "INCOME") acc[day].income += t.amount
    else acc[day].expense += t.amount
    acc[day].total = acc[day].income - acc[day].expense
    return acc
  }, {})

  const dailyArray = Object.values(dailyTotals) as any[]

  const daysCount = startDate && endDate ? 
    Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 
    dailyArray.length || 1
  const burnRate = expenseTotal / daysCount

  const userBudgets = await prisma.budget.findMany({
    where: { userId }
  })

  const categoryBreakdown = transactions.reduce((acc: any, t) => {
    if (t.type !== "EXPENSE") return acc
    const catName = t.category.name
    const catId = t.category.id
    if (!acc[catName]) {
      const budget = userBudgets.find(b => b.categoryId === catId)
      acc[catName] = { 
        id: catId,
        name: catName, 
        value: 0, 
        color: t.category.color,
        budgetLimit: budget?.amount || 5000
      }
    }
    acc[catName].value += t.amount
    return acc
  }, {})

  const avgExpense = expenseTotal / (dailyArray.length || 1)
  const spikes = dailyArray.filter(d => d.expense > avgExpense * 1.8)

  let bucketedData = []
  if (daysCount <= 31) {
    bucketedData = dailyArray.map(d => ({ name: format(new Date(d.date), "MMM d"), ...d }))
  } else if (daysCount <= 92) {
    const weeks: any = {}
    transactions.forEach(t => {
      const weekKey = `Week ${Math.ceil(t.date.getDate() / 7)}`
      if (!weeks[weekKey]) weeks[weekKey] = { name: weekKey, income: 0, expense: 0, total: 0 }
      if (t.type === "INCOME") weeks[weekKey].income += t.amount
      else weeks[weekKey].expense += t.amount
      weeks[weekKey].total = weeks[weekKey].income - weeks[weekKey].expense
    })
    bucketedData = Object.values(weeks)
  } else {
    const months: any = {}
    transactions.forEach(t => {
      const monthKey = t.date.toLocaleString('default', { month: 'short' })
      if (!months[monthKey]) months[monthKey] = { name: monthKey, income: 0, expense: 0, total: 0 }
      if (t.type === "INCOME") months[monthKey].income += t.amount
      else months[monthKey].expense += t.amount
      months[monthKey].total = months[monthKey].income - months[monthKey].expense
    })
    bucketedData = Object.values(months)
  }

  let previousTotalExpense = 0
  if (startDate && endDate) {
    const duration = endDate.getTime() - startDate.getTime()
    const prevStart = new Date(startDate.getTime() - duration)
    const prevEnd = new Date(endDate.getTime() - duration)

    const prevTotals = await prisma.expense.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: prevStart, lte: prevEnd }
      },
      _sum: { amount: true }
    })
    previousTotalExpense = prevTotals._sum.amount || 0
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
    transactions
  }
}
