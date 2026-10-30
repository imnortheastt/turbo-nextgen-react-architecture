import { z } from "zod"

import { m } from "@/shared/i18n"

// Messages resolve once at module load; fine because setLocale() reloads the page.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email(m.validation_email()))

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, m.validation_password_required()),
})
