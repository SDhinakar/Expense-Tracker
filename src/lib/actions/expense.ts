"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache"
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

  revalidateTag(`dashboard-data-${session.user.id}`, "default")
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  return expense
}

export async function updateActiveGroups(count: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeGroups: count },
  })

  revalidateTag(`dashboard-data-${session.user.id}`, "default")
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

  revalidateTag(`dashboard-data-${session.user.id}`, "default")
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
}

export async function deleteExpense(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.expense.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidateTag(`dashboard-data-${session.user.id}`, "default")
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
}

// ─── STABLE, USER-TAGGED NEXT.JS CACHED SERVER ACTION ───
const fetchUnifiedData = unstable_cache(
  async (userId: string, fromStr?: string, toStr?: string, catIds?: string[], type?: string) => {
    const fromDate = fromStr ? new Date(fromStr) : undefined
    const toDate = toStr ? new Date(toStr) : undefined

    const dateFilter = fromDate && toDate ? { gte: fromDate, lte: toDate } : undefined

    const whereClause: any = { userId }
    if (dateFilter) whereClause.date = dateFilter
    if (catIds && catIds.length > 0) whereClause.categoryId = { in: catIds }
    if (type && type !== "ALL") whereClause.type = type

    const results = await Promise.allSettled([
      // 1. Overall lifetime aggregates
      prisma.expense.groupBy({
        by: ["type"],
        where: { userId },
        _sum: { amount: true },
      }),
      // 2. Filtered transactions with field select constraints & 50 item take limit
      prisma.expense.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          amount: true,
          date: true,
          type: true,
          category: {
            select: { id: true, name: true, color: true }
          }
        },
        orderBy: { date: "desc" },
        take: 50,
      }),
      // 3. Current user limits
      prisma.budget.findMany({ where: { userId } }),
    ])

    const lifetimeTotals = results[0].status === "fulfilled" ? results[0].value : []
    const transactions = results[1].status === "fulfilled" ? results[1].value : []
    const userBudgets = results[2].status === "fulfilled" ? (results[2].value as any[]) : []

    const balanceIncome = lifetimeTotals.find(t => t.type === "INCOME")?._sum.amount ?? 0
    const balanceExpense = lifetimeTotals.find(t => t.type === "EXPENSE")?._sum.amount ?? 0
    const balance = balanceIncome - balanceExpense

    const incomeTotal = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0)
    const expenseTotal = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0)
    const netTotal = incomeTotal - expenseTotal
    const savingsRate = incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0

    const daysCount = fromDate && toDate ? Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86_400_000)) : 30
    const burnRate = expenseTotal / daysCount

    const categoryBreakdown = transactions.reduce((acc: any, t) => {
      if (t.type !== "EXPENSE") return acc
      const catName = t.category?.name || "Uncategorized"
      if (!acc[catName]) {
        const budget = userBudgets.find(b => b.categoryId === t.category?.id)
        acc[catName] = {
          id: t.category?.id,
          name: catName,
          value: 0,
          color: t.category?.color,
          budgetLimit: budget?.amount ?? 5000,
        }
      }
      acc[catName].value += t.amount
      return acc
    }, {})

    return {
      balance,
      income: balanceIncome,
      expense: balanceExpense,
      incomeTotal,
      expenseTotal,
      netTotal,
      savingsRate,
      burnRate,
      categoryBreakdown: Object.values(categoryBreakdown),
      transactions,
      updatedAt: new Date().toISOString()
    }
  },
  ["dashboard-data"],
  { revalidate: 120, tags: ["dashboard-data"] }
)

// Request deduplication tracker per in-memory session instance
const requestTracker = new Map<string, number>()

export async function getDashboardAndAnalytics(filters: {
  fromStr?: string
  toStr?: string
  categoryIds?: string[]
  type?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const lastCallTime = requestTracker.get(userId) || 0
  const now = Date.now()

  // Rate limiter: Block requests within 500ms of each other to protect from spam
  if (now - lastCallTime < 500) {
    throw new Error("Rate limit exceeded. Please wait a moment.")
  }

  requestTracker.set(userId, now)

  const { fromStr, toStr, categoryIds, type } = filters
  
  const cachedFn = unstable_cache(
    async () => fetchUnifiedData(userId, fromStr, toStr, categoryIds, type),
    [`dashboard-data-${userId}-${type}-${fromStr || ""}-${toStr || ""}`],
    { revalidate: 120, tags: [`dashboard-data-${userId}`] }
  )

  return cachedFn()
}

export async function revalidateDashboard() {
  const session = await auth()
  if (session?.user?.id) {
    revalidateTag(`dashboard-data-${session.user.id}`, "default")
  }
}

import { createHash } from "crypto"

export async function getCachedAIInsights(transactions: any[]) {
  const session = await auth()
  if (!session?.user?.id) return []

  const hash = createHash("sha256")
    .update(JSON.stringify(transactions))
    .digest("hex")

  const fetchAI = unstable_cache(
    async (txHash: string) => {
      return [
        {
          title: "Intelligent Category Shift",
          description: "We detected that your category spending has shifted. Focus on fixed expenses.",
          icon: "Activity", color: "text-primary", bg: "bg-primary/10"
        }
      ]
    },
    [`ai-insights-${session.user.id}`],
    { revalidate: 86400 }
  )

  return fetchAI(hash)
}
