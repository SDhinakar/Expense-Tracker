"use client"

import { Plus } from "lucide-react"
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog"
import { motion } from "framer-motion"

export function Fab() {
  return (
    <AddExpenseDialog>
      <motion.button
        className="md:hidden fixed bottom-[76px] left-1/2 -translate-x-1/2 z-[60]
          w-14 h-14 rounded-full flex items-center justify-center
          text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.65 0.24 264), oklch(0.70 0.22 300))",
          boxShadow: "0 0 0 0 oklch(0.65 0.24 264 / 0.6), 0 8px 24px oklch(0.65 0.24 264 / 0.4)",
        }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        animate={{
          boxShadow: [
            "0 0 0 0px oklch(0.65 0.24 264 / 0.5), 0 8px 24px oklch(0.65 0.24 264 / 0.35)",
            "0 0 0 10px oklch(0.65 0.24 264 / 0), 0 8px 24px oklch(0.65 0.24 264 / 0.35)",
          ],
        }}
        transition={{
          boxShadow: {
            duration: 1.4,
            ease: "easeOut",
            repeat: Infinity,
          },
        }}
        aria-label="Add transaction"
      >
        <motion.div
          animate={{ rotate: [0, 0] }}
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.25 }}
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </AddExpenseDialog>
  )
}
