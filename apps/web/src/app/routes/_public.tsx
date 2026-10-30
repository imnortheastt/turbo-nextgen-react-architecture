import { createFileRoute, Outlet } from "@tanstack/react-router"

import { PublicLayout } from "../layout/PublicLayout.tsx"

export const Route = createFileRoute("/_public")({
  component: () => (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  ),
})
