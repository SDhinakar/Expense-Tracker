"use client"

import { useState, useEffect } from "react"
import { createExpense } from "@/lib/actions/expense"
import { getCategories } from "@/lib/actions/category"
import { TransactionType, SplitType, Category } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function AddExpenseDialog({ children }: { children: React.ReactElement }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const router = useRouter()

  const [formData, setFormData] = useState<{
    amount: string
    title: string
    categoryId: string
    type: TransactionType
    splitType: SplitType
    date: Date
  }>({
    amount: "",
    title: "",
    categoryId: "",
    type: TransactionType.EXPENSE,
    splitType: SplitType.EQUAL,
    date: new Date()
  })

  useEffect(() => {
    if (open) {
      getCategories().then(setCategories)
    }
  }, [open])

  async function handleSubmit() {
    if (!formData.amount || !formData.title || !formData.categoryId) {
      alert("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      await createExpense({
        title: formData.title,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId,
        type: formData.type,
        date: formData.date,
        splitType: formData.splitType
      })
      setOpen(false)
      setFormData({
        amount: "",
        title: "",
        categoryId: "",
        type: TransactionType.EXPENSE,
        splitType: SplitType.EQUAL,
        date: new Date()
      })
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-[425px] glass border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Add Transaction</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Track your income or expenses with precision.
          </DialogDescription>
        </DialogHeader>

        <div className="flex bg-muted/50 p-1 rounded-xl border border-white/5 mb-4">
          <button
            onClick={() => setFormData({ ...formData, type: TransactionType.EXPENSE })}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              formData.type === TransactionType.EXPENSE ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            Expense
          </button>
          <button
            onClick={() => setFormData({ ...formData, type: TransactionType.INCOME })}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              formData.type === TransactionType.INCOME ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            Income
          </button>
        </div>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white font-medium">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
              <Input
                id="amount"
                placeholder="0.00"
                className="pl-8 h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all text-lg font-bold"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-white font-medium">
              Description
            </Label>
            <Input
              id="title"
              placeholder="What was this for?"
              className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-white font-medium">
              Category
            </Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(val) => val && setFormData({ ...formData, categoryId: val })}
            >
              <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="glass border-white/10">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="focus:bg-primary/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color ?? '#6366f1' }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white font-medium">Date</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <div
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex h-12 w-full items-center rounded-xl px-3 text-sm cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </div>
                }
              />
              <PopoverContent className="w-auto p-0 glass border-white/10">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData({ ...formData, date })}
                  initialFocus
                  className="bg-background text-foreground"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-white">
            Cancel
          </Button>
          <Button 
            type="button" 
            disabled={loading} 
            onClick={handleSubmit}
            className="bg-primary text-white hover:bg-primary/90 px-8 h-11 rounded-xl shadow-lg shadow-primary/20"
          >
            {loading ? "Processing..." : "Save Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
