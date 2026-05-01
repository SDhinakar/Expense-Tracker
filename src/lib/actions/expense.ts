"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { TransactionType, SplitType, PrismaClient } from "@prisma/client"

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

    // Instantiating PrismaClient dynamically inside the action for total fail-safe connection on Vercel
    const actionPrisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } }
    })

    const user = await actionPrisma.user.findUnique({
      where: { id: userId },
      select: { activeGroups: true }
    })

    // Recent transactions (always lifetime)
    const expenses = await actionPrisma.expense.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5
    })

    // Lifetime Totals (for Balance)
    const lifetimeTotals = await actionPrisma.expense.groupBy({
      by: ["type"],
      where: { userId },
      _sum: { amount: true }
    })

    const totalIncome = lifetimeTotals.find(t => t.type === "INCOME")?._sum.amount || 0
    const totalExpense = lifetimeTotals.find(t => t.type === "EXPENSE")?._sum.amount || 0
    const balance = totalIncome - totalExpense

    // Period Totals
    const periodTotals = await actionPrisma.expense.groupBy({
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
    const dailyTransactions = await actionPrisma.expense.findMany({
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

    await actionPrisma.$disconnect()

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
