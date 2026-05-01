"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getBudgets() {
  const session = await auth()
  if (!session?.user?.id) return []

  return await prisma.budget.findMany({
    where: { userId: session.user.id }
  })
}

export async function updateBudget(categoryId: string, amount: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.budget.upsert({
    where: {
      userId_categoryId: {
        userId: session.user.id,
        categoryId
      }
    },
    update: { amount },
    create: {
      userId: session.user.id,
      categoryId,
      amount
    }
  })

  revalidatePath("/analytics")
}
