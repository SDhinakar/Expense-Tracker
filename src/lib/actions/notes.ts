"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { RecurrenceType } from "@prisma/client"

export async function getChecklistTasks() {
  const session = await auth()
  if (!session?.user?.id) return []

  return await prisma.checklistTask.findMany({
    where: { userId: session.user.id },
    include: {
      logs: {
        orderBy: { completedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function createChecklistTask(data: {
  title: string
  description?: string
  recurrence: RecurrenceType
  customInterval?: number
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const task = await prisma.checklistTask.create({
    data: {
      ...data,
      userId: session.user.id,
      nextDue: calculateNextDue(data.recurrence, data.customInterval),
    },
  })

  revalidatePath("/notes")
  return task
}

export async function updateChecklistTask(
  id: string,
  data: {
    title: string
    description?: string
    recurrence: RecurrenceType
    customInterval?: number
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const task = await prisma.checklistTask.update({
    where: { id, userId: session.user.id },
    data,
  })

  revalidatePath("/notes")
  return task
}

export async function deleteChecklistTask(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.checklistTask.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidatePath("/notes")
}

export async function markTaskCompleted(taskId: string, notes?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const task = await prisma.checklistTask.findFirst({
    where: { id: taskId, userId: session.user.id },
  })

  if (!task) throw new Error("Task not found")

  const now = new Date()

  // Create log
  await prisma.checklistLog.create({
    data: {
      taskId,
      userId: session.user.id,
      completedAt: now,
      notes,
    },
  })

  // Update task's lastCompleted and nextDue
  const nextDue = calculateNextDue(task.recurrence, task.customInterval, now)

  await prisma.checklistTask.update({
    where: { id: taskId },
    data: {
      lastCompleted: now,
      nextDue,
    },
  })

  revalidatePath("/notes")
}

// Helper to calculate next due date
function calculateNextDue(
  recurrence: RecurrenceType,
  customInterval?: number | null,
  from: Date = new Date()
): Date | null {
  if (recurrence === "NONE") return null

  const next = new Date(from)
  if (recurrence === "DAILY") {
    next.setDate(next.getDate() + 1)
  } else if (recurrence === "WEEKLY") {
    next.setDate(next.getDate() + 7)
  } else if (recurrence === "MONTHLY") {
    next.setMonth(next.getMonth() + 1)
  } else if (recurrence === "CUSTOM" && customInterval) {
    next.setDate(next.getDate() + customInterval)
  }

  // Set to start of day for cleaner comparisons
  next.setHours(0, 0, 0, 0)
  return next
}

// Personal Notes
export async function getPersonalNotes() {
  const session = await auth()
  if (!session?.user?.id) return []

  return await prisma.personalNote.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })
}

export async function createPersonalNote(content: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const note = await prisma.personalNote.create({
    data: {
      content,
      userId: session.user.id,
    },
  })

  revalidatePath("/notes")
  return note
}

export async function updatePersonalNote(id: string, content: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const note = await prisma.personalNote.update({
    where: { id, userId: session.user.id },
    data: { content },
  })

  revalidatePath("/notes")
  return note
}

export async function deletePersonalNote(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.personalNote.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidatePath("/notes")
}
