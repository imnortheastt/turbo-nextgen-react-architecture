import { useForm } from "@tanstack/react-form"
import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { forgotPasswordSchema, useForgotPassword } from "@/entities/session"
import { m } from "@/shared/i18n"
import { TextField } from "@/shared/ui"
import { Button } from "@repo/ui/components/button"

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword()
  const [sentTo, setSentTo] = useState<string>()
  const [formError, setFormError] = useState<string>()

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      setFormError(undefined)
      const { email } = forgotPasswordSchema.parse(value)
      try {
        await forgotPassword.mutateAsync({ email })
      } catch {
        setFormError(m.error_generic())
        return
      }
      // Same message whether or not the account exists (no account enumeration).
      setSentTo(email)
    },
  })

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{m.auth_forgot_title()}</h1>
      {sentTo ? (
        <output className="block text-sm">{m.auth_forgot_sent({ email: sentTo })}</output>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{m.auth_forgot_description()}</p>
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
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {m.auth_forgot_submit()}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </>
      )}
      <Link to="/login" className="text-sm text-primary underline-offset-4 hover:underline">
        {m.auth_back_to_sign_in()}
      </Link>
    </section>
  )
}
