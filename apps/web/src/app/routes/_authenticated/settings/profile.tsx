import { createFileRoute } from "@tanstack/react-router"

import { ProfilePage } from "@/pages/profile"
import { m } from "@/shared/i18n"

export const Route = createFileRoute("/_authenticated/settings/profile")({
  head: () => ({ meta: [{ title: `${m.nav_profile()} · FSD Boilerplate` }] }),
  component: ProfilePage,
})
