import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"
import { Fab } from "@/components/ui/Fab"

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      {/* pb-[88px] = 68px BottomNav + 20px breathing room on mobile */}
      <main className="flex-1 pb-[88px] md:pb-0 overflow-y-auto min-w-0 relative z-10">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile FAB + BottomNav */}
      <Fab />
      <BottomNav />
    </div>
  )
}
