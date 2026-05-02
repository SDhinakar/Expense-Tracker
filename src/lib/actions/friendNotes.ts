"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { NoteType } from "@prisma/client"

export async function getFriendNotes() {
  const session = await auth()
  if (!session?.user?.id) return []

  return await prisma.friendNote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
}

export async function createFriendNote(data: {
  friendName: string
  amount: number
  type: NoteType
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const note = await prisma.friendNote.create({
    data: {
      friendName: data.friendName,
      amount: data.amount,
      type: data.type,
      notes: data.notes || null,
      userId: session.user.id,
      isSettled: false,
    },
  })

  revalidatePath("/secret-notes")
  return note
}

export async function updateFriendNote(
  id: string,
  data: {
    friendName?: string
    amount?: number
    type?: NoteType
    notes?: string
    isSettled?: boolean
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const note = await prisma.friendNote.update({
    where: { id, userId: session.user.id },
    data,
  })

  revalidatePath("/secret-notes")
  return note
}

export async function toggleSettled(id: string, isSettled: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const note = await prisma.friendNote.update({
    where: { id, userId: session.user.id },
    data: { isSettled },
  })

  revalidatePath("/secret-notes")
  return note
}

export async function deleteFriendNote(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.friendNote.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidatePath("/secret-notes")
}
