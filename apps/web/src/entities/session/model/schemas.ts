import { z } from "zod"

import { m } from "@/shared/i18n"

// Messages resolve once at module load; fine because setLocale() reloads the page.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email(m.validation_email()))

const nameSchema = z.string().trim().min(1, m.validation_name()).max(100)

// Mirrors the API contract (RegisterRequest / ResetPasswordRequest): 8–128 characters.
const newPasswordSchema = z
  .string()
  .min(8, m.validation_password_min())
  .max(128, m.validation_password_max())

const passwordsMatch = (value: { password: string; confirmPassword: string }) =>
  value.password === value.confirmPassword
const MISMATCH = { message: m.validation_password_mismatch(), path: ["confirmPassword"] }

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, m.validation_password_required()),
})

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, MISMATCH)

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z
  .object({ password: newPasswordSchema, confirmPassword: z.string() })
  .refine(passwordsMatch, MISMATCH)

export const profileSchema = z.object({ name: nameSchema })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, m.validation_password_required()),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, MISMATCH)
