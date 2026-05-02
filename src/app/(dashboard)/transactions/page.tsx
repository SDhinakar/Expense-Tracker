"use client"

import { useState, useEffect, useCallback, useDeferredValue } from "react"
import { getExpenses, deleteExpense } from "@/lib/actions/expense"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Search, Pencil, ArrowUpRight, ArrowDownRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditExpenseDialog } from "@/components/expenses/EditExpenseDialog"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useDateRange } from "@/contexts/DateRangeContext"
import { cn } from "@/lib/utils"
import { Loader } from "@/components/ui/loader"

export default function TransactionsPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  // Defer the filter so typing feels instant — React batches the expensive filter pass
  const search = useDeferredValue(searchInput)
  const { dateRange, setDateRange } = useDateRange()

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    const data = await getExpenses(
      dateRange?.from ? { from: dateRange.from, to: dateRange.to } : undefined
    )
    setExpenses(data)
    setLoading(false)
  }, [dateRange])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this transaction?")) {
      await deleteExpense(id)
      setExpenses(expenses.filter(ex => ex.id !== id))
    }
  }

  // Server already filtered by date — only search filtering needed client-side
  const filteredExpenses = search.trim()
    ? expenses.filter(
        (ex) =>
          ex.title.toLowerCase().includes(search.toLowerCase()) ||
          ex.category.name.toLowerCase().includes(search.toLowerCase())
      )
    : expenses

  const downloadCSV = () => {
    const headers = ["Date", "Description", "Category", "Amount", "Type"]
    const rows = filteredExpenses.map(ex => [
      format(new Date(ex.date), "yyyy-MM-dd"),
      ex.title,
      ex.category.name,
      ex.amount,
      ex.type
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">Financial <span className="text-primary">Ledger</span></h1>
          <p className="text-muted-foreground mt-1 text-sm">A complete audit trail of your financial movements.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 min-w-0 sm:max-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              className="pl-11 glass border-white/5 h-11 rounded-xl w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button
            onClick={downloadCSV}
            variant="outline"
            className="h-11 glass border-white/5 bg-white/5 hover:bg-white/10 text-white font-medium px-4 rounded-xl transition-all shrink-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="glass-card border-white/5 overflow-hidden">
        <CardHeader className="bg-white/5 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-white">Transaction History</CardTitle>
              <CardDescription className="text-muted-foreground">
                Showing {filteredExpenses.length} transactions for the selected period.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile card view (hidden on md+) */}
          <div className="md:hidden divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <Loader inline />
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center text-muted-foreground py-20">
                  No transactions found in this range.
                </div>
              ) : (
                filteredExpenses.map((expense) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={expense.id}
                    className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-white/5 transition-colors"
                  >
                    {/* Left: icon + info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "shrink-0 p-2.5 rounded-xl",
                        expense.type === "INCOME" ? "bg-emerald-500/15" : "bg-rose-500/15"
                      )}>
                        {expense.type === "INCOME"
                          ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                          : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{expense.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {format(new Date(expense.date), "MMM d, yyyy")}
                          </span>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-white/5 text-muted-foreground border border-white/5">
                            {expense.category.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Right: amount + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "font-black text-sm",
                        expense.type === "INCOME" ? "text-emerald-500" : "text-white"
                      )}>
                        {expense.type === "INCOME" ? "+" : "-"}₹{expense.amount.toLocaleString('en-IN')}
                      </span>
                      <EditExpenseDialog expense={expense} onSuccess={loadExpenses}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 glass border-white/5 text-muted-foreground hover:text-primary transition-all"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </EditExpenseDialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 glass border-white/5 text-muted-foreground hover:text-rose-500 transition-all"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Desktop table view (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="w-[150px] text-muted-foreground uppercase text-[10px] font-black tracking-widest pl-8">Date</TableHead>
                  <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Description</TableHead>
                  <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Category</TableHead>
                  <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest text-right">Amount</TableHead>
                  <TableHead className="w-[100px] text-center text-muted-foreground uppercase text-[10px] font-black tracking-widest pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Loader inline />
                      </TableCell>
                    </TableRow>
                  ) : filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-20">
                        No transactions found in this range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={expense.id}
                        className="group border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <TableCell className="text-muted-foreground pl-8 py-4">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              expense.type === "INCOME" ? "bg-emerald-500/10" : "bg-rose-500/10"
                            )}>
                              {expense.type === "INCOME"
                                ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
                            </div>
                            <span className="font-bold text-white group-hover:text-primary transition-colors">{expense.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-white/5 text-muted-foreground border border-white/5">
                            {expense.category.name}
                          </span>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-black py-4",
                          expense.type === "INCOME" ? "text-emerald-500" : "text-white"
                        )}>
                          {expense.type === "INCOME" ? "+" : "-"}₹{expense.amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-center py-4 pr-8">
                          <div className="flex items-center justify-center gap-2">
                            <EditExpenseDialog expense={expense} onSuccess={loadExpenses}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 glass border-white/5 text-muted-foreground hover:text-primary transition-all"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </EditExpenseDialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 glass border-white/5 text-muted-foreground hover:text-rose-500 transition-all"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
