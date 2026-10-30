import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { VerifyEmailPage } from "@/pages/verify-email"
import { m } from "@/shared/i18n"

import { GuestLayout } from "../layout/GuestLayout.tsx"

const verifySearchSchema = z.object({ token: z.string().catch("") })

// Not under _guest: the link must work whether or not the user is signed in.
export const Route = createFileRoute("/verify-email")({
  validateSearch: verifySearchSchema,
  // The page spends a single-use token; never let a hover preload touch it.
  preload: false,
  head: () => ({ meta: [{ title: `${m.auth_verify_title()} · FSD Boilerplate` }] }),
  component: () => (
    <GuestLayout>
      <VerifyEmailPage />
    </GuestLayout>
  ),
})
