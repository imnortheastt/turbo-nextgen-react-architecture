import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"

import { useAuthStore } from "@/shared/model"
import { Button } from "@repo/ui/components/button"

export function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)

  async function handleLogout() {
    logout()
    // Drop the previous user's cached server data before the guard re-runs.
    queryClient.clear()
    await router.invalidate()
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Only visible when signed in.</p>
      <Button variant="outline" className="self-start" onClick={() => void handleLogout()}>
        Sign out
      </Button>
    </section>
  )
}
