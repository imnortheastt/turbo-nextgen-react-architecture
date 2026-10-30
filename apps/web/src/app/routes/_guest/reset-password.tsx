import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { ResetPasswordPage } from "@/pages/reset-password"
import { m } from "@/shared/i18n"

// A missing or malformed token renders the page's "invalid link" state.
const resetSearchSchema = z.object({ token: z.string().catch("") })

export const Route = createFileRoute("/_guest/reset-password")({
  validateSearch: resetSearchSchema,
  head: () => ({ meta: [{ title: `${m.auth_reset_title()} · FSD Boilerplate` }] }),
  component: ResetPasswordPage,
})
