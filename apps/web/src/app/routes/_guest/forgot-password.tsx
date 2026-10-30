import { createFileRoute } from "@tanstack/react-router"

import { ForgotPasswordPage } from "@/pages/forgot-password"
import { m } from "@/shared/i18n"

export const Route = createFileRoute("/_guest/forgot-password")({
  head: () => ({ meta: [{ title: `${m.auth_forgot_title()} · FSD Boilerplate` }] }),
  component: ForgotPasswordPage,
})
