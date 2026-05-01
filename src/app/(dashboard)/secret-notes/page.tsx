import { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { FriendNoteClient } from "@/components/secret-notes/FriendNoteClient"

export const metadata: Metadata = {
  title: "Secret Friend Notes | Zenith",
  description: "Keep track of the amounts you need to give to or get from friends securely.",
}

export default async function SecretNotesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const initialNotes = await prisma.friendNote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-4 sm:p-8">
      <FriendNoteClient initialNotes={initialNotes} />
    </div>
  )
}
