import { Shell } from "@/components/layout/Shell"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardDataProvider } from "@/context/DashboardDataContext"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) {
    redirect("/")
  }

  return (
    <DashboardDataProvider>
      <Shell>{children}</Shell>
    </DashboardDataProvider>
  )
}
