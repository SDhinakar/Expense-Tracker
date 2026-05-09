"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info"

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const success = useCallback((message: string) => addToast(message, "success"), [addToast])
  const error = useCallback((message: string) => addToast(message, "error"), [addToast])
  const info = useCallback((message: string) => addToast(message, "info"), [addToast])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-20 md:bottom-6 right-0 left-0 md:left-auto md:right-6 z-[100] flex flex-col gap-2 p-4 md:p-0 items-center md:items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "glass shadow-xl shadow-black/20 pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl min-w-[300px] max-w-sm",
                t.type === "success" && "border-emerald-500/20 bg-emerald-500/10",
                t.type === "error" && "border-rose-500/20 bg-rose-500/10",
                t.type === "info" && "border-primary/20 bg-primary/10"
              )}
            >
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {t.type === "info" && <Info className="w-5 h-5 text-primary shrink-0" />}
              
              <p className="text-sm font-medium text-white flex-1">{t.message}</p>
              
              <button 
                onClick={() => removeToast(t.id)}
                className="text-white/50 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
