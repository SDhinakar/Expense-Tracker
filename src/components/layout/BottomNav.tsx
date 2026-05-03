"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, History, BarChart3, Notebook, LogOut, Sparkles } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const navItems = [
  {
    label: "Home",
    href: "/dashboard",
    icon: Home,
    activeColor: "oklch(0.65 0.24 264)",
    activeBg: "oklch(0.65 0.24 264 / 0.15)",
    glow: "oklch(0.65 0.24 264 / 0.8)",
  },
  {
    label: "Txns",
    href: "/transactions",
    icon: History,
    activeColor: "oklch(0.72 0.22 300)",
    activeBg: "oklch(0.72 0.22 300 / 0.15)",
    glow: "oklch(0.72 0.22 300 / 0.8)",
  },
  {
    label: "Notes",
    href: "/secret-notes",
    icon: Notebook,
    activeColor: "oklch(0.76 0.18 145)",
    activeBg: "oklch(0.76 0.18 145 / 0.15)",
    glow: "oklch(0.76 0.18 145 / 0.8)",
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const activeItem = navItems.find((item) => item.href === pathname)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-white/[0.06] bg-background/90 backdrop-blur-2xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex-1 flex flex-col items-center justify-center gap-[3px] h-16 min-w-0"
          >
            {/* Sliding background pill — one shared layoutId inside a single parent */}
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-x-1 inset-y-1 rounded-2xl"
                style={{ background: item.activeBg }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}

            <motion.div
              className="relative z-10"
              animate={isActive ? { y: -1, scale: 1.1 } : { y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <item.icon
                className="w-[19px] h-[19px]"
                style={
                  isActive
                    ? { color: item.activeColor, filter: `drop-shadow(0 0 5px ${item.glow})` }
                    : { color: "oklch(0.55 0.01 264)" }
                }
              />
            </motion.div>

            <span
              className="relative z-10 text-[9.5px] font-bold tracking-wide leading-none"
              style={isActive ? { color: item.activeColor } : { color: "oklch(0.5 0.01 264)" }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}

      {/* Logout — same height, no flex-1 squeeze */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex-1 flex flex-col items-center justify-center gap-[3px] h-16 min-w-0"
      >
        <LogOut className="w-[19px] h-[19px]" style={{ color: "oklch(0.55 0.01 264)" }} />
        <span className="text-[9.5px] font-bold tracking-wide leading-none" style={{ color: "oklch(0.5 0.01 264)" }}>
          Logout
        </span>
      </button>
    </nav>
  )
}
