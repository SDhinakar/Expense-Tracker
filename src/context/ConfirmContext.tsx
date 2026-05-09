"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: "danger" | "info"
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" })
  const [resolveRef, setResolveRef] = useState<{ resolve: (value: boolean) => void } | null>(null)

  const confirm = useCallback((params: ConfirmOptions | string) => {
    const config = typeof params === "string" ? { message: params } : params
    setOptions({
      title: "Are you sure?",
      confirmText: "Confirm",
      cancelText: "Cancel",
      type: "danger",
      ...config
    })
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolveRef({ resolve })
    })
  }, [])

  const handleClose = useCallback((value: boolean) => {
    setOpen(false)
    if (resolveRef) {
      resolveRef.resolve(value)
    }
  }, [resolveRef])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose(false)}>
        <DialogContent className="sm:max-w-[400px] glass border-white/10 text-white bg-[#0A0A0A]/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <DialogTitle className="text-xl font-black">{options.title}</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              {options.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => handleClose(false)}
              className="flex-1 h-11 text-muted-foreground hover:text-white transition-colors"
            >
              {options.cancelText}
            </Button>
            <Button
              onClick={() => handleClose(true)}
              className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20"
            >
              {options.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (context === undefined) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context
}
