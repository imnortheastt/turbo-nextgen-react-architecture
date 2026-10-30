import { createFileRoute } from "@tanstack/react-router"

import { RegisterPage } from "@/pages/register"
import { m } from "@/shared/i18n"

export const Route = createFileRoute("/_guest/register")({
  head: () => ({ meta: [{ title: `${m.auth_register_title()} · FSD Boilerplate` }] }),
  component: RegisterPage,
})
