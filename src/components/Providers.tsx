"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { DateRangeProvider } from "@/contexts/DateRangeContext"
import { ToastProvider } from "@/context/ToastContext"
import { ConfirmProvider } from "@/context/ConfirmContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <DateRangeProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </ToastProvider>
        </DateRangeProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
