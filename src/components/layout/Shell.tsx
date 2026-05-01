import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"
import { Fab } from "@/components/ui/Fab"

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto min-w-0">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Fab />
      <BottomNav />
    </div>
  )
}
