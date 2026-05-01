import { Shell } from "@/components/layout/Shell"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In a real scenario with DB connected, uncomment to enforce auth
  const session = await auth()
  if (!session) {
    redirect("/")
  }

  return <Shell>{children}</Shell>
}
