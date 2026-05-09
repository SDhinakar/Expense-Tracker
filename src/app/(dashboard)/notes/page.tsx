import { Metadata } from "next"
import { ChecklistTracker } from "@/components/notes/ChecklistTracker"
import { PersonalNotesBoard } from "@/components/notes/PersonalNotesBoard"
import { getChecklistTasks, getPersonalNotes } from "@/lib/actions/notes"

export const metadata: Metadata = {
  title: "Personal Notes | Zenithe",
  description: "Manage personal routines and quick notes",
}

export default async function NotesPage() {
  const [tasks, notes] = await Promise.all([
    getChecklistTasks(),
    getPersonalNotes()
  ])

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
          Personal <span className="text-primary">Space</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track daily routines and capture quick thoughts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="h-full min-h-[400px]">
          <ChecklistTracker initialTasks={tasks} />
        </div>
        <div className="h-full min-h-[400px]">
          <PersonalNotesBoard initialNotes={notes} />
        </div>
      </div>
    </div>
  )
}
