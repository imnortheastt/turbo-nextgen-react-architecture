import { createFileRoute } from "@tanstack/react-router"

import { sessionsQuery } from "@/entities/session"
import { SecurityPage } from "@/pages/security"
import { m } from "@/shared/i18n"

export const Route = createFileRoute("/_authenticated/settings/security")({
  // Start loading the sessions list without blocking the page (it shows a skeleton).
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(sessionsQuery)
  },
  head: () => ({ meta: [{ title: `${m.nav_security()} · FSD Boilerplate` }] }),
  component: SecurityPage,
})
