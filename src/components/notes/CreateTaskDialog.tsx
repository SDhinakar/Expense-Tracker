"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Pencil, Loader2, Sparkles } from "lucide-react"
import { generateTaskDescription } from "@/lib/actions/ai"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createChecklistTask, updateChecklistTask } from "@/lib/actions/notes"
import { RecurrenceType } from "@prisma/client"
import { useToast } from "@/context/ToastContext"

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  recurrence: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM", "NONE"]),
  customInterval: z.coerce.number().min(1).optional().nullable(),
}).refine((data) => {
  if (data.recurrence === "CUSTOM") {
    return !!data.customInterval;
  }
  return true;
}, {
  message: "Custom interval is required",
  path: ["customInterval"],
});

interface TaskFormValues {
  title: string;
  description?: string | null;
  recurrence: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM" | "NONE";
  customInterval?: number | null;
}

interface CreateTaskDialogProps {
  task?: any // If editing
  children?: React.ReactNode
  onSuccess?: () => void
}

export function CreateTaskDialog({ task, children, onSuccess }: CreateTaskDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [aiLoading, setAiLoading] = React.useState(false)
  const { error, success } = useToast()

  const handleGenerateDescription = async () => {
    const title = form.getValues("title")
    if (!title) {
      error("Please enter a task name first")
      return
    }

    try {
      setAiLoading(true)
      const description = await generateTaskDescription(title)
      if (description) {
        form.setValue("description", description)
        success("AI generated a description!")
      }
    } catch (err) {
      error("AI failed to generate description")
    } finally {
      setAiLoading(false)
    }
  }

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      recurrence: task?.recurrence || "DAILY",
      customInterval: task?.customInterval || undefined,
    },
  })

  const recurrence = form.watch("recurrence")

  async function onSubmit(data: TaskFormValues) {
    try {
      setLoading(true)
      if (task?.id) {
        await updateChecklistTask(task.id, {
          title: data.title,
          description: data.description,
          recurrence: data.recurrence as RecurrenceType,
          customInterval: data.recurrence === "CUSTOM" ? data.customInterval! : undefined,
        })
      } else {
        await createChecklistTask({
          title: data.title,
          description: data.description,
          recurrence: data.recurrence as RecurrenceType,
          customInterval: data.recurrence === "CUSTOM" ? data.customInterval! : undefined,
        })
      }
      setOpen(false)
      form.reset()
      success(task?.id ? "Routine updated" : "Routine created")
      onSuccess?.()
    } catch (err) {
      console.error(err)
      error("Failed to save task")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (open && task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        recurrence: task.recurrence,
        customInterval: task.customInterval || undefined,
      })
    } else if (open && !task) {
      form.reset({
        title: "",
        description: "",
        recurrence: "DAILY",
        customInterval: undefined,
      })
    }
  }, [open, task, form])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        // @ts-ignore - Base UI prop to avoid 'nativeButton' warning when wrapping non-buttons
        nativeButton={!children}
        render={
          children ? (children as React.ReactElement) : (
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 gap-2 h-10 px-4">
              <Plus className="w-4 h-4" />
              <span className="font-bold">New Routine</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white bg-[#0A0A0A]/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {task ? "Edit Routine" : "Add New Routine"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {task ? "Change your routine details below." : "Add a new thing to your checklist."}
          </DialogDescription>
        </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Name</label>
              <Input 
                placeholder="e.g. Water plants, Laundry, Room clean" 
                className="glass border-white/10 focus-visible:ring-primary h-11" 
                {...form.register("title")} 
              />
              {form.formState.errors.title && (
                <p className="text-xs text-rose-500">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={aiLoading}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Auto-Fill
                </button>
              </div>
              <Textarea 
                placeholder="Add any specific details here..." 
                className="glass border-white/10 focus-visible:ring-primary min-h-[80px] resize-none" 
                {...form.register("description")} 
              />
              {form.formState.errors.description && (
                <p className="text-xs text-rose-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={cn("space-y-2", recurrence === "CUSTOM" ? "col-span-1" : "col-span-2")}>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Repeat</label>
                <Select 
                  onValueChange={(val) => form.setValue("recurrence", val as any)} 
                  value={recurrence}
                >
                  <SelectTrigger className="glass border-white/10 focus:ring-primary h-11">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white bg-background/95 backdrop-blur-xl">
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="CUSTOM">Custom Days</SelectItem>
                    <SelectItem value="NONE">No Repeat</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.recurrence && (
                  <p className="text-xs text-rose-500">{form.formState.errors.recurrence.message}</p>
                )}
              </div>

              {recurrence === "CUSTOM" && (
                <div className="col-span-1 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Days</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 3" 
                    className="glass border-white/10 focus-visible:ring-primary h-11" 
                    {...form.register("customInterval", { valueAsNumber: true })} 
                  />
                  {form.formState.errors.customInterval && (
                    <p className="text-xs text-rose-500">{form.formState.errors.customInterval.message}</p>
                  )}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 mt-4" 
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {task ? "Save Changes" : "Create Routine"}
            </Button>
          </form>
      </DialogContent>
    </Dialog>
  )
}
