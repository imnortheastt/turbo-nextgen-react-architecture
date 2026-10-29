import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { LoginPage } from "@/pages/login"

const loginSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  head: () => ({ meta: [{ title: "Sign in · FSD Boilerplate" }] }),
  component: LoginPage,
})
