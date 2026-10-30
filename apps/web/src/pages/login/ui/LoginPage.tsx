import { useForm } from "@tanstack/react-form"
import { Link, useRouter, useSearch } from "@tanstack/react-router"
import { useState } from "react"

import { apiErrorCode, loginSchema, useLogin } from "@/entities/session"
import { m } from "@/shared/i18n"
import { safeRedirect } from "@/shared/lib"
import { TextField } from "@/shared/ui"
import { Button } from "@repo/ui/components/button"

const LINK = "text-primary underline-offset-4 hover:underline"

export function LoginPage() {
  const router = useRouter()
  const { redirect } = useSearch({ from: "/_guest/login" })
  const login = useLogin()
  const [formError, setFormError] = useState<string>()

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setFormError(undefined)
      try {
        await login.mutateAsync(loginSchema.parse(value))
      } catch (error) {
        setFormError(
          apiErrorCode(error) === "invalid_credentials"
            ? m.auth_invalid_credentials()
            : m.error_generic(),
        )
        return
      }
      // No router.invalidate(): it would re-run the guest guard on this page and
      // bounce to /dashboard before the redirect below. Navigation runs the
      // destination's guards against the session cached by useLogin.
      // safeRedirect only yields same-origin paths, so `?redirect=` can never leave the app.
      await router.navigate({ href: safeRedirect(redirect) })
    },
  })

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{m.auth_sign_in_title()}</h1>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        <form.Field name="email">
          {(field) => (
            <TextField field={field} label={m.auth_email()} type="email" autoComplete="email" />
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <TextField
              field={field}
              label={m.auth_password()}
              type="password"
              autoComplete="current-password"
            />
          )}
        </form.Field>
        <Link to="/forgot-password" className={`self-end text-sm ${LINK}`}>
          {m.auth_forgot_link()}
        </Link>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {m.auth_sign_in()}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className="text-sm text-muted-foreground">
        {m.auth_no_account()}{" "}
        <Link to="/register" className={LINK}>
          {m.auth_create_one()}
        </Link>
      </p>
    </section>
  )
}
