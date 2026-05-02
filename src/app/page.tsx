import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="w-full max-w-md space-y-8 text-center glass p-8 rounded-2xl border border-white/5 shadow-2xl">
        <div className="space-y-3 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Zenithe
          </h1>
          <p className="text-muted-foreground text-sm max-w-[300px]">
            Advanced financial intelligence platform for smart wealth tracking.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/10 transition-all active:scale-95 py-6 text-base font-bold rounded-xl">
              Continue with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
