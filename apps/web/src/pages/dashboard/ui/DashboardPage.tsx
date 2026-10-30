import { useQuery } from "@tanstack/react-query"

import { sessionQuery } from "@/entities/session"
import { m } from "@/shared/i18n"

export function DashboardPage() {
  const { data: user } = useQuery(sessionQuery)

  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{m.nav_dashboard()}</h1>
      {user && <p className="text-muted-foreground">{m.dashboard_welcome({ name: user.name })}</p>}
    </section>
  )
}
