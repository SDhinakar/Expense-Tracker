import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Zenith
          </h1>
          <p className="text-muted-foreground">
            Track your expenses, manage groups, and analyze your financial health.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <Button type="submit" size="lg" className="w-full">
              Continue with Google
            </Button>
          </form>
          {/* For development/testing, we can just allow navigation to dashboard without auth if needed */}
          <form
            action={async () => {
              "use server"
              redirect("/dashboard")
            }}
          >
             <Button variant="outline" type="submit" size="lg" className="w-full">
              Preview Dashboard
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
