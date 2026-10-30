import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { sessionQuery } from "@/entities/session"

import { GuestLayout } from "../layout/GuestLayout.tsx"

/** Sign-in and account-recovery pages: signed-in users go straight to the dashboard. */
export const Route = createFileRoute("/_guest")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(sessionQuery)
    if (user) throw redirect({ to: "/dashboard" })
  },
  component: () => (
    <GuestLayout>
      <Outlet />
    </GuestLayout>
  ),
})
