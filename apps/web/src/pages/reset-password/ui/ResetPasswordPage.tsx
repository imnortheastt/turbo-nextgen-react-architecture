import { useForm } from "@tanstack/react-form"
import { Link, useRouter, useSearch } from "@tanstack/react-router"
import { useState } from "react"

import { apiErrorCode, resetPasswordSchema, useResetPassword } from "@/entities/session"
import { m } from "@/shared/i18n"
import { TextField } from "@/shared/ui"
import { Button } from "@repo/ui/components/button"
import { toast } from "@repo/ui/components/sonner"

const LINK = "text-sm text-primary underline-offset-4 hover:underline"

export function ResetPasswordPage() {
  const router = useRouter()
  const { token } = useSearch({ from: "/_guest/reset-password" })
  const resetPassword = useResetPassword()
  const [linkInvalid, setLinkInvalid] = useState(!token)
  const [formError, setFormError] = useState<string>()

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onSubmit: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      setFormError(undefined)
      const { password } = resetPasswordSchema.parse(value)
      try {
        await resetPassword.mutateAsync({ token, password })
      } catch (error) {
        if (apiErrorCode(error) === "invalid_token") setLinkInvalid(true)
        else setFormError(m.error_generic())
        return
      }
      toast.success(m.auth_reset_done())
      // replace: keep the spent reset token out of the browser history.
      await router.navigate({ to: "/login", replace: true })
    },
  })

  if (linkInvalid) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{m.auth_reset_title()}</h1>
        <p role="alert" className="text-sm text-destructive">
          {m.auth_link_invalid()}
        </p>
        <Link to="/forgot-password" className={LINK}>
          {m.auth_request_new_link()}
        </Link>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{m.auth_reset_title()}</h1>
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
        <form.Field name="password">
          {(field) => (
            <TextField
              field={field}
              label={m.auth_new_password()}
              type="password"
              autoComplete="new-password"
            />
          )}
        </form.Field>
        <form.Field name="confirmPassword">
          {(field) => (
            <TextField
              field={field}
              label={m.auth_confirm_password()}
              type="password"
              autoComplete="new-password"
            />
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {m.auth_reset_submit()}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <Link to="/login" className={LINK}>
        {m.auth_back_to_sign_in()}
      </Link>
    </section>
  )
}
