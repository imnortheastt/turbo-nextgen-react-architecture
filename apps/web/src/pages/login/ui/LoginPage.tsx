import { useForm } from "@tanstack/react-form"
import { useRouter, useSearch } from "@tanstack/react-router"
import { useState } from "react"

import { apiErrorCode, loginSchema, useLogin } from "@/entities/session"
import { m } from "@/shared/i18n"
import { safeRedirect } from "@/shared/lib"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

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
    <section className="flex max-w-sm flex-col gap-4">
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
          {(field) => {
            const error = field.state.meta.errors[0]?.message
            return (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>{m.auth_email()}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${field.name}-error` : undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {error && (
                  <p id={`${field.name}-error`} className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
            )
          }}
        </form.Field>
        <form.Field name="password">
          {(field) => {
            const error = field.state.meta.errors[0]?.message
            return (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>{m.auth_password()}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${field.name}-error` : undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {error && (
                  <p id={`${field.name}-error`} className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
            )
          }}
        </form.Field>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {m.auth_sign_in()}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </section>
  )
}
