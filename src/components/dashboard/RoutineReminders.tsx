"use client"

import React, { useEffect, useState } from "react"
import { getChecklistTasks } from "@/lib/actions/notes"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react"
import { startOfDay } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function RoutineReminders() {
  const [dueTasks, setDueTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDue() {
      try {
        const tasks = await getChecklistTasks()
        const today = startOfDay(new Date())
        
        const due = tasks.filter(task => {
          if (!task.nextDue) return false
          return startOfDay(new Date(task.nextDue)) <= today
        })
        
        setDueTasks(due)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDue()
  }, [])

  if (loading || dueTasks.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Link href="/notes">
        <div className="group relative overflow-hidden glass border-amber-500/20 bg-amber-500/5 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-amber-500/10 hover:border-amber-500/40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                Routine Reminder
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              </h4>
              <p className="text-xs text-muted-foreground font-bold">
                You have <span className="text-amber-500">{dueTasks.length} routine{dueTasks.length > 1 ? "s" : ""}</span> due for completion today.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex -space-x-2">
              {dueTasks.slice(0, 3).map((task, i) => (
                <div key={task.id} className="w-8 h-8 rounded-full bg-[#0A0A0A] border border-white/10 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                   {task.title[0].toUpperCase()}
                </div>
              ))}
              {dueTasks.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-muted-foreground shadow-xl">
                  +{dueTasks.length - 3}
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          
          {/* Subtle background glow */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />
        </div>
      </Link>
    </motion.div>
  )
}
