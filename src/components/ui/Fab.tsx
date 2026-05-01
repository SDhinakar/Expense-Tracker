import { Plus } from "lucide-react"
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog"

export function Fab() {
  return (
    <AddExpenseDialog>
      <button className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform z-[60]">
        <Plus className="w-8 h-8" />
      </button>
    </AddExpenseDialog>
  )
}
