import { memo } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Category, Expense } from "@prisma/client"
import { motion } from "framer-motion"

interface RecentTransactionsProps {
  transactions: (Expense & { category: Category })[]
}

export const RecentTransactions = memo(function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="space-y-6">
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No recent transactions.</p>
      ) : (
        transactions.map((tx, index) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center group"
          >
            <Avatar className="h-10 w-10 border border-white/5 group-hover:border-primary/50 transition-colors shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {tx.category.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-0.5 min-w-0">
              <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors truncate">{tx.title}</p>
              <p className="text-xs text-muted-foreground">{tx.category.name}</p>
            </div>
            <div className="ml-auto font-bold text-sm shrink-0 pl-2">
              <span className={tx.type === "INCOME" ? "text-emerald-500" : "text-foreground"}>
                {tx.type === "INCOME" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
              </span>
            </div>
          </motion.div>
        ))
      )}
    </div>
  )
})
