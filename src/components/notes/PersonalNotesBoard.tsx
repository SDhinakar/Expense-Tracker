"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StickyNote, Plus, Trash2, Loader2, Save, Sparkles, Wand2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { createPersonalNote, updatePersonalNote, deletePersonalNote } from "@/lib/actions/notes"
import { cn } from "@/lib/utils"
import { useToast } from "@/context/ToastContext"
import { useConfirm } from "@/context/ConfirmContext"
import { processNoteWithAI } from "@/lib/actions/ai"

export function PersonalNotesBoard({ initialNotes }: { initialNotes: any[] }) {
  const [notes, setNotes] = React.useState(initialNotes)
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const { success, error, info } = useToast()
  const { confirm } = useConfirm()

  // AI State
  const [aiProcessingId, setAiProcessingId] = React.useState<string | null>(null)
  
  // Sync state when props change
  React.useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])
  
  // Track local edits
  const [editingContents, setEditingContents] = React.useState<Record<string, string>>({})

  const handleAIAction = async (id: string, action: "summarize" | "refine") => {
    const content = editingContents[id] || notes.find(n => n.id === id)?.content
    if (!content) return

    try {
      setAiProcessingId(id)
      info("Zenithe AI is thinking...")
      const result = await processNoteWithAI(content, action)
      if (result) {
        setEditingContents(prev => ({ ...prev, [id]: result }))
        success("AI made some changes. Click save to keep them!")
      }
    } catch (err) {
      error("AI is having some trouble. Try again later.")
    } finally {
      setAiProcessingId(null)
    }
  }

  const handleAddNew = async () => {
    try {
      setSavingId("new")
      const newNote = await createPersonalNote("")
      setNotes([newNote, ...notes])
      setEditingContents(prev => ({ ...prev, [newNote.id]: "" }))
      success("Note created")
    } catch (err) {
      console.error(err)
      error("Failed to create note")
    } finally {
      setSavingId(null)
    }
  }

  const handleSave = async (id: string) => {
    const content = editingContents[id]
    if (content === undefined) return // No changes

    try {
      setSavingId(id)
      await updatePersonalNote(id, content)
      setNotes(prev => prev.map(n => n.id === id ? { ...n, content, updatedAt: new Date() } : n))
      
      // Clear from editing state once saved
      setEditingContents(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      success("Note saved")
    } catch (err) {
      console.error(err)
      error("Failed to save note")
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (await confirm("Delete this note?")) {
      await deletePersonalNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
      setEditingContents(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      success("Note deleted")
    }
  }

  return (
    <Card className="glass-card border-white/5 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 bg-white/5">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-blue-500" />
            Quick Notes
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1 text-xs">
            Jot down thoughts and reminders
          </CardDescription>
        </div>
        <Button 
          onClick={handleAddNew}
          disabled={savingId === "new"}
          className="bg-blue-500 hover:bg-blue-500/90 text-white rounded-xl shadow-lg shadow-blue-500/20 gap-2 h-10 px-4 shrink-0"
        >
          {savingId === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span className="font-bold hidden sm:inline">Add Note</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
          <AnimatePresence mode="popLayout">
            {notes.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="col-span-full text-center py-12 text-muted-foreground"
              >
                No notes yet. Click Add Note to create one.
              </motion.div>
            ) : (
              notes.map(note => {
                const isEditing = editingContents[note.id] !== undefined
                const content = isEditing ? editingContents[note.id] : note.content
                const isSaving = savingId === note.id

                return (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex flex-col gap-3 min-h-[150px] transition-all hover:border-blue-500/40 relative focus-within:ring-2 focus-within:ring-blue-500"
                  >
                    <Textarea
                      value={content}
                      onChange={(e) => setEditingContents(prev => ({ ...prev, [note.id]: e.target.value }))}
                      placeholder="Type your note here..."
                      className="flex-1 bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-white placeholder:text-muted-foreground/50 h-full min-h-[100px]"
                    />
                    
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        {format(new Date(note.updatedAt), "MMM d, h:mm a")}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {isEditing && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1.5"
                            onClick={() => handleSave(note.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span className="text-xs font-bold">Save</span>
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger 
                            nativeButton={false}
                            render={
                              <span 
                                role="button"
                                tabIndex={0}
                                className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                {aiProcessingId === note.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              </span>
                            }
                          />
                          <DropdownMenuContent align="end" className="glass border-white/10 bg-[#0A0A0A]/95 text-white">
                            <DropdownMenuItem 
                              onClick={() => handleAIAction(note.id, "summarize")}
                              className="gap-2 cursor-pointer focus:bg-white/10 focus:text-white"
                            >
                              <Wand2 className="w-4 h-4 text-primary" /> Summarize
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleAIAction(note.id, "refine")}
                              className="gap-2 cursor-pointer focus:bg-white/10 focus:text-white"
                            >
                              <Sparkles className="w-4 h-4 text-primary" /> Refine & Fix
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
