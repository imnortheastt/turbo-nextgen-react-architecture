import { createFileRoute } from "@tanstack/react-router"

import { DashboardPage } from "@/pages/dashboard"

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · FSD Boilerplate" }] }),
  component: DashboardPage,
})
