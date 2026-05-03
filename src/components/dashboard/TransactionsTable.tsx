"use client"

import * as React from "react"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownRight, ArrowUpDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface TransactionsTableProps {
  transactions: any[]
  loading?: boolean
}

export function TransactionsTable({ transactions, loading }: TransactionsTableProps) {
  const [sortKey, setSortKey] = React.useState<"date" | "amount">("date")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [page, setPage] = React.useState(1)
  const itemsPerPage = 8

  // Sorting
  const sortedTransactions = React.useMemo(() => {
    if (!transactions) return []
    return [...transactions].sort((a, b) => {
      if (sortKey === "date") {
        const d1 = new Date(a.date).getTime()
        const d2 = new Date(b.date).getTime()
        return sortOrder === "asc" ? d1 - d2 : d2 - d1
      } else {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount
      }
    })
  }, [transactions, sortKey, sortOrder])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / itemsPerPage))
  const paginatedTransactions = React.useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return sortedTransactions.slice(start, start + itemsPerPage)
  }, [sortedTransactions, page])

  function toggleSort(key: "date" | "amount") {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("desc")
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-white/5 border border-white/5 rounded-xl w-full" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center gap-3">
        <div className="p-3 bg-white/5 text-muted-foreground rounded-full">
          <ArrowUpDown className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">No transactions found</p>
          <p className="text-muted-foreground text-xs mt-0.5">Try adjusting your filters or search period.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-white/5 bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
        {paginatedTransactions.map((expense) => (
          <div key={expense.id} className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("shrink-0 p-2.5 rounded-xl", expense.type === "INCOME" ? "bg-emerald-500/15" : "bg-rose-500/15")}>
                {expense.type === "INCOME" ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{expense.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{format(new Date(expense.date), "MMM d, yyyy")}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-white/5 text-muted-foreground border border-white/5">
                    {expense.category?.color && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: expense.category.color }} />
                    )}
                    {expense.category?.name}
                  </span>
                </div>
              </div>
            </div>
            <span className={cn("font-black text-sm shrink-0", expense.type === "INCOME" ? "text-emerald-500" : "text-white")}>
              {expense.type === "INCOME" ? "+" : "-"}₹{expense.amount.toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white/5 rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead
                className="w-[140px] text-muted-foreground uppercase text-[10px] font-black tracking-widest pl-8 cursor-pointer select-none"
                onClick={() => toggleSort("date")}
              >
                <div className="flex items-center gap-1">
                  Date
                  {sortKey === "date" && <ArrowUpDown className="w-3 h-3 text-primary" />}
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Description</TableHead>
              <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Category</TableHead>
              <TableHead
                className="text-muted-foreground uppercase text-[10px] font-black tracking-widest text-right pr-8 cursor-pointer select-none"
                onClick={() => toggleSort("amount")}
              >
                <div className="flex items-center gap-1 justify-end">
                  Amount
                  {sortKey === "amount" && <ArrowUpDown className="w-3 h-3 text-primary" />}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {paginatedTransactions.map((expense) => (
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
                      <div className={cn("p-2 rounded-lg", expense.type === "INCOME" ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                        {expense.type === "INCOME" ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                      <span className="font-bold text-white group-hover:text-primary transition-colors">
                        {expense.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-white/5 text-muted-foreground border border-white/5">
                      {expense.category?.color && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: expense.category.color }} />
                      )}
                      {expense.category?.name}
                    </span>
                  </TableCell>
                  <TableCell className={cn("text-right font-black py-4 pr-8", expense.type === "INCOME" ? "text-emerald-500" : "text-white")}>
                    {expense.type === "INCOME" ? "+" : "-"}₹{expense.amount.toLocaleString("en-IN")}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-xs glass text-white hover:bg-white/10 rounded-xl"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-xs glass text-white hover:bg-white/10 rounded-xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
