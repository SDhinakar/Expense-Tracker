"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getCategories() {
  const session = await auth()
  const userId = session?.user?.id

  return await prisma.category.findMany({
    where: {
      OR: [
        { isDefault: true },
        { userId: userId || undefined }
      ]
    },
    orderBy: { name: "asc" }
  })
}
