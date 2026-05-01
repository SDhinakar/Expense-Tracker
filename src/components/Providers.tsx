"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { DateRangeProvider } from "@/contexts/DateRangeContext"

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
          {children}
        </DateRangeProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
