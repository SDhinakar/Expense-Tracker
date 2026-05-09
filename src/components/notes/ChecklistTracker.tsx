"use client"

import * as React from "react"
import { format, isPast, isToday, isTomorrow, startOfDay } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, MoreVertical, Trash2, Calendar, Clock, Loader2, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { markTaskCompleted, deleteChecklistTask } from "@/lib/actions/notes"
import { CreateTaskDialog } from "./CreateTaskDialog"
import { useToast } from "@/context/ToastContext"
import { useConfirm } from "@/context/ConfirmContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ChecklistTracker({ initialTasks }: { initialTasks: any[] }) {
  const [tasks, setTasks] = React.useState(initialTasks)
  const [completingId, setCompletingId] = React.useState<string | null>(null)
  const { error, success } = useToast()
  const { confirm } = useConfirm()
  const router = useRouter()

  // Sync state when props change (via router.refresh)
  React.useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // Sort tasks: Overdue first, then due today, then due later, then completed recently
  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const now = startOfDay(new Date())
      const aDue = a.nextDue ? startOfDay(new Date(a.nextDue)) : null
      const bDue = b.nextDue ? startOfDay(new Date(b.nextDue)) : null
      
      // If one has no due date, put it at the bottom
      if (!aDue && bDue) return 1
      if (aDue && !bDue) return -1
      if (!aDue && !bDue) return 0

      return aDue!.getTime() - bDue!.getTime()
    })
  }, [tasks])

  const handleComplete = async (taskId: string) => {
    try {
      setCompletingId(taskId)
      await markTaskCompleted(taskId)
      
      // Optimistic update
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const now = new Date()
          return {
            ...t,
            lastCompleted: now,
            // very simple optimistic nextDue (real one is calculated on server)
            nextDue: t.recurrence === "DAILY" ? new Date(now.getTime() + 86400000) : t.nextDue,
            logs: [{ completedAt: now }]
          }
        }
        return t
      }))
    } catch (err) {
      console.error(err)
      error("Failed to mark completed")
    } finally {
      setCompletingId(null)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (await confirm("Delete this routine?")) {
      await deleteChecklistTask(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      success("Routine deleted")
    }
  }

  const getStatusColor = (nextDue: Date | null) => {
    if (!nextDue) return "text-muted-foreground"
    
    const dueDay = startOfDay(new Date(nextDue))
    const today = startOfDay(new Date())
    
    if (dueDay < today) return "text-rose-500 font-bold" // Overdue
    if (dueDay.getTime() === today.getTime()) return "text-amber-500 font-bold" // Due today
    return "text-emerald-500" // Due later
  }

  const getStatusText = (nextDue: Date | null) => {
    if (!nextDue) return "No due date"
    
    const dueDay = startOfDay(new Date(nextDue))
    const today = startOfDay(new Date())
    
    if (dueDay < today) return "Overdue"
    if (dueDay.getTime() === today.getTime()) return "Due Today"
    if (isTomorrow(dueDay)) return "Due Tomorrow"
    return `Due ${format(dueDay, "MMM d")}`
  }

  return (
    <Card className="glass-card border-white/5 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 bg-white/5">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Routine Tracker
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1 text-xs">
            Manage personal habits and recurring tasks
          </CardDescription>
        </div>
        <CreateTaskDialog onSuccess={() => router.refresh()} />
      </CardHeader>
      <CardContent className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-12 text-muted-foreground"
              >
                No routines found. Create one to get started!
              </motion.div>
            ) : (
              sortedTasks.map(task => {
                const isOverdue = task.nextDue && startOfDay(new Date(task.nextDue)) < startOfDay(new Date())
                
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group p-4 rounded-xl border transition-all duration-300",
                      isOverdue 
                        ? "bg-rose-500/5 border-rose-500/20" 
                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={() => handleComplete(task.id)}
                        disabled={completingId === task.id}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors disabled:opacity-50"
                      >
                        {completingId === task.id ? (
                          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-white text-base truncate">{task.title}</h3>
                            {task.description && (
                              <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{task.description}</p>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger 
                              nativeButton={false}
                              render={
                                <span 
                                  role="button"
                                  tabIndex={0}
                                  className="h-8 w-8 -mr-2 flex items-center justify-center text-muted-foreground hover:text-white shrink-0 rounded-md transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </span>
                              } 
                            />
                            <DropdownMenuContent align="end" className="glass border-white/10 bg-[#0A0A0A]/95 text-white">
                              <CreateTaskDialog task={task} onSuccess={() => router.refresh()}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer focus:bg-white/10 focus:text-white">
                                  <Pencil className="w-4 h-4" /> Edit Routine
                                </DropdownMenuItem>
                              </CreateTaskDialog>
                              <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 gap-2 cursor-pointer">
                                <Trash2 className="w-4 h-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          {task.nextDue && (
                            <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1 border border-white/5">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className={cn("text-[10px] uppercase tracking-wider", getStatusColor(task.nextDue))}>
                                {getStatusText(task.nextDue)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1 border border-white/5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                              {task.lastCompleted 
                                ? `Last done: ${format(new Date(task.lastCompleted), "MMM d, h:mm a")}` 
                                : "Never completed"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1 border border-white/5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                              Rep: <span className="text-white">{task.recurrence}</span>
                              {task.recurrence === "CUSTOM" && ` (${task.customInterval} days)`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
