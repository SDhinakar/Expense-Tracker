"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, History, BarChart3, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 bg-background/80 backdrop-blur-xl pb-safe flex justify-around items-center h-16 px-2 z-50">
      <Link
        href="/dashboard"
        className={cn(
          "flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl transition-all",
          pathname === "/dashboard" ? "text-primary" : "text-muted-foreground hover:text-white"
        )}
      >
        <Home className={cn("w-5 h-5", pathname === "/dashboard" && "drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]")} />
        <span className="text-[10px] font-semibold">Home</span>
      </Link>

      <Link
        href="/transactions"
        className={cn(
          "flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl transition-all",
          pathname === "/transactions" ? "text-primary" : "text-muted-foreground hover:text-white"
        )}
      >
        <History className={cn("w-5 h-5", pathname === "/transactions" && "drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]")} />
        <span className="text-[10px] font-semibold">Txns</span>
      </Link>

      {/* Perfect center Spacer for the FAB */}
      <div className="w-16 h-14 shrink-0 pointer-events-none" />

      <Link
        href="/analytics"
        className={cn(
          "flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl transition-all",
          pathname === "/analytics" ? "text-primary" : "text-muted-foreground hover:text-white"
        )}
      >
        <BarChart3 className={cn("w-5 h-5", pathname === "/analytics" && "drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]")} />
        <span className="text-[10px] font-semibold">Analytics</span>
      </Link>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-muted-foreground hover:text-rose-500 transition-all"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Logout</span>
      </button>
    </nav>
  )
}
