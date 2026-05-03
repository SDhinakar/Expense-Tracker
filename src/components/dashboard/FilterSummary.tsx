"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FilterSummaryProps {
  incomeTotal: number
  expenseTotal: number
  netTotal: number
}

export function FilterSummary({ incomeTotal, expenseTotal, netTotal }: FilterSummaryProps) {
  return (
    <Card className="glass-card border-white/5">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Filter Summary</CardTitle>
        <CardDescription>Totals for the current selection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
          <span className="text-muted-foreground font-medium">Income</span>
          <span className="text-emerald-500 font-black text-lg">₹{incomeTotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
          <span className="text-muted-foreground font-medium">Expense</span>
          <span className="text-rose-500 font-black text-lg">₹{expenseTotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/10">
          <span className="text-white font-bold">Net Flow</span>
          <span className={cn("font-black text-lg", netTotal >= 0 ? "text-emerald-500" : "text-rose-500")}>
            ₹{netTotal.toLocaleString("en-IN")}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
