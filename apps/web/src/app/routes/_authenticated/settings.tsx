import { createFileRoute, Outlet } from "@tanstack/react-router"

import { SettingsLayout } from "../../layout/SettingsLayout.tsx"

export const Route = createFileRoute("/_authenticated/settings")({
  component: () => (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  ),
})
