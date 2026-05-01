"use client"

import { useState } from "react"
import { FriendNote, NoteType } from "@prisma/client"
import { useRouter } from "next/navigation"
import { createFriendNote, updateFriendNote, toggleSettled, deleteFriendNote } from "@/lib/actions/friendNotes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, CheckCircle2, Circle, ArrowUpRight, ArrowDownLeft, Notebook, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function FriendNoteClient({ initialNotes }: { initialNotes: FriendNote[] }) {
  const [notes, setNotes] = useState<FriendNote[]>(initialNotes)
  const [activeTab, setActiveTab] = useState<"active" | "settled">("active")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState<{
    friendName: string
    amount: string
    type: NoteType
    notes: string
  }>({
    friendName: "",
    amount: "",
    type: "GET",
    notes: "",
  })

  const [editData, setEditData] = useState<{
    id: string
    friendName: string
    amount: string
    type: NoteType
    notes: string
  }>({
    id: "",
    friendName: "",
    amount: "",
    type: "GET",
    notes: "",
  })

  // Summary logic
  const toGet = notes
    .filter((n) => !n.isSettled && n.type === "GET")
    .reduce((sum, n) => sum + n.amount, 0)
  const toGive = notes
    .filter((n) => !n.isSettled && n.type === "GIVE")
    .reduce((sum, n) => sum + n.amount, 0)
  const net = toGet - toGive

  // Form handling
  async function handleAddNote() {
    if (!formData.friendName || !formData.amount) {
      alert("Please fill in Name and Amount")
      return
    }

    setLoading(true)
    try {
      const newNote = await createFriendNote({
        friendName: formData.friendName,
        amount: parseFloat(formData.amount),
        type: formData.type,
        notes: formData.notes,
      })

      setNotes([newNote, ...notes])
      setFormData({ friendName: "", amount: "", type: "GET", notes: "" })
      setIsAddOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleEditNote() {
    if (!editData.friendName || !editData.amount) {
      alert("Please fill in Name and Amount")
      return
    }

    setLoading(true)
    try {
      const updated = await updateFriendNote(editData.id, {
        friendName: editData.friendName,
        amount: parseFloat(editData.amount),
        type: editData.type,
        notes: editData.notes,
      })

      setNotes(notes.map((n) => (n.id === updated.id ? updated : n)))
      setIsEditOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleSettled(note: FriendNote) {
    try {
      const updated = await toggleSettled(note.id, !note.isSettled)
      setNotes(notes.map((n) => (n.id === updated.id ? updated : n)))
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  async function handleDeleteNote(id: string) {
    try {
      await deleteFriendNote(id)
      setNotes(notes.filter((n) => n.id !== id))
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  const filteredNotes = notes.filter((n) =>
    activeTab === "settled" ? n.isSettled : !n.isSettled
  )

  return (
    <div className="space-y-8 animate-in-fade pb-20">
      {/* Page header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Notebook className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Secret Notes</h1>
          </div>
          <p className="text-muted-foreground mt-1">Keep track of amounts to get from and give to your friends.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={
              <Button className="w-full sm:w-auto h-12 gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95 group shrink-0">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-semibold">Add Ledger Note</span>
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] glass border-white/10 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Add Ledger Note</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Set up a new amount to track with a friend.
              </DialogDescription>
            </DialogHeader>

            <div className="flex bg-muted/50 p-1 rounded-xl border border-white/5 mb-4">
              <button
                onClick={() => setFormData({ ...formData, type: "GET" })}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                  formData.type === "GET" ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                )}
              >
                I Need to Get
              </button>
              <button
                onClick={() => setFormData({ ...formData, type: "GIVE" })}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                  formData.type === "GIVE" ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                )}
              >
                I Need to Give
              </button>
            </div>

            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="friendName" className="text-white font-medium">Friend Name</Label>
                <Input
                  id="friendName"
                  placeholder="e.g. Arun, Babu"
                  className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                  value={formData.friendName}
                  onChange={(e) => setFormData({ ...formData, friendName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white font-medium">Amount</Label>
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
                <Label htmlFor="notes" className="text-white font-medium">Description (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="What was this for?"
                  className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-white">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={handleAddNote}
                className="bg-primary text-white hover:bg-primary/90 px-8 h-11 rounded-xl shadow-lg shadow-primary/20"
              >
                {loading ? "Saving..." : "Create Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl flex flex-col justify-between premium-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">To Get</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-white">₹{toGet.toLocaleString()}</h3>
            <p className="text-xs text-muted-foreground mt-1">Pending from friends</p>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col justify-between premium-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">To Give</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-white">₹{toGive.toLocaleString()}</h3>
            <p className="text-xs text-muted-foreground mt-1">Payable to friends</p>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col justify-between premium-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Net Ledger</span>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border",
              net >= 0 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            )}>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-white">
              {net >= 0 ? "+" : ""}₹{net.toLocaleString()}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Outstanding overall balance</p>
          </div>
        </div>
      </div>

      {/* Dynamic Tabs */}
      <div className="flex gap-4 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab("active")}
          className={cn(
            "text-sm font-bold pb-2 transition-all border-b-2",
            activeTab === "active" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"
          )}
        >
          Active Notes ({notes.filter((n) => !n.isSettled).length})
        </button>
        <button
          onClick={() => setActiveTab("settled")}
          className={cn(
            "text-sm font-bold pb-2 transition-all border-b-2",
            activeTab === "settled" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"
          )}
        >
          Settled Notes ({notes.filter((n) => n.isSettled).length})
        </button>
      </div>

      {/* Grid of Note Cards */}
      {filteredNotes.length === 0 ? (
        <div className="glass p-12 rounded-2xl text-center premium-border">
          <h3 className="text-lg font-bold text-white">No entries found</h3>
          <p className="text-muted-foreground mt-1">There are no {activeTab} notes right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="glass p-6 rounded-2xl flex flex-col justify-between premium-border relative group animate-in-fade"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{note.friendName}</h3>
                    <span className={cn(
                      "text-xs px-2.5 py-0.5 rounded-full font-medium border uppercase tracking-wider",
                      note.type === "GET"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {note.type === "GET" ? "Getting" : "Giving"}
                    </span>
                  </div>
                  {note.notes && <p className="text-sm text-muted-foreground">{note.notes}</p>}
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  <p className={cn(
                    "text-xl font-bold mt-1 tracking-tight",
                    note.isSettled 
                      ? "text-muted-foreground line-through decoration-white/20"
                      : note.type === "GET" 
                        ? "text-emerald-400" 
                        : "text-rose-400"
                  )}>
                    ₹{note.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                <button
                  onClick={() => handleToggleSettled(note)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-all"
                >
                  {note.isSettled ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Settled</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-5 h-5" />
                      <span>Mark Settled</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditData({
                        id: note.id,
                        friendName: note.friendName,
                        amount: note.amount.toString(),
                        type: note.type,
                        notes: note.notes || "",
                      })
                      setIsEditOpen(true)
                    }}
                    className="text-muted-foreground hover:text-white"
                  >
                    Edit
                  </Button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-muted-foreground hover:text-rose-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Edit Ledger Note</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modify the amount or tracking details with this friend.
            </DialogDescription>
          </DialogHeader>

          <div className="flex bg-muted/50 p-1 rounded-xl border border-white/5 mb-4">
            <button
              onClick={() => setEditData({ ...editData, type: "GET" })}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                editData.type === "GET" ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              I Need to Get
            </button>
            <button
              onClick={() => setEditData({ ...editData, type: "GIVE" })}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                editData.type === "GIVE" ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              I Need to Give
            </button>
          </div>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFriendName" className="text-white font-medium">Friend Name</Label>
              <Input
                id="editFriendName"
                placeholder="e.g. Arun, Babu"
                className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                value={editData.friendName}
                onChange={(e) => setEditData({ ...editData, friendName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAmount" className="text-white font-medium">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                <Input
                  id="editAmount"
                  placeholder="0.00"
                  className="pl-8 h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all text-lg font-bold"
                  type="number"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes" className="text-white font-medium">Description (Optional)</Label>
              <Input
                id="editNotes"
                placeholder="What was this for?"
                className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="text-muted-foreground hover:text-white">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={handleEditNote}
              className="bg-primary text-white hover:bg-primary/90 px-8 h-11 rounded-xl shadow-lg shadow-primary/20"
            >
              {loading ? "Updating..." : "Update Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
