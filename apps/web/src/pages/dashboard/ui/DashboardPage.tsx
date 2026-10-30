import { useLogout } from "@/entities/session"
import { Button } from "@repo/ui/components/button"

export function DashboardPage() {
  const logout = useLogout()

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Only visible when signed in.</p>
      <Button
        variant="outline"
        className="self-start"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        Sign out
      </Button>
    </section>
  )
}
