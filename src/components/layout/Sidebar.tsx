"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PieChart, Wallet, Settings, Plus, LayoutDashboard, History, BarChart3, Sparkles, Notebook } from "lucide-react"
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog"
import { Button } from "@/components/ui/button"
import { UserNav } from "./UserNav"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Secret Notes", href: "/secret-notes", icon: Notebook },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-72 glass border-r border-white/5 h-screen sticky top-0 z-50">
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Zenithe</h2>
        </div>

        <AddExpenseDialog>
          <Button className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95 group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-semibold">New Transaction</span>
          </Button>
        </AddExpenseDialog>
      </div>

      <nav className="flex-1 px-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group",
                isActive ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 transition-colors z-10",
                isActive ? "text-primary" : "group-hover:text-white"
              )} />
              <span className="font-medium z-10">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-white/5 space-y-4">
        <div className="px-2 pt-2">
          <UserNav />
        </div>
      </div>
    </aside>
  )
}
