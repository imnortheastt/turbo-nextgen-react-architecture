import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { sessionQuery } from "@/entities/session"

import { DashboardLayout } from "../layout/DashboardLayout.tsx"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(sessionQuery)
    if (!user) throw redirect({ to: "/login", search: { redirect: location.href } })
  },
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
})
