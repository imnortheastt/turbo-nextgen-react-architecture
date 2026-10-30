import { useForm } from "@tanstack/react-form"
import { Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { apiErrorCode, registerSchema, useRegister } from "@/entities/session"
import { m } from "@/shared/i18n"
import { TextField } from "@/shared/ui"
import { Button } from "@repo/ui/components/button"

export function RegisterPage() {
  const router = useRouter()
  const registerAccount = useRegister()
  const [formError, setFormError] = useState<string>()

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    validators: { onSubmit: registerSchema },
    onSubmit: async ({ value, formApi }) => {
      setFormError(undefined)
      const { name, email, password } = registerSchema.parse(value)
      try {
        await registerAccount.mutateAsync({ name, email, password })
      } catch (error) {
        if (apiErrorCode(error) === "email_taken") {
          formApi.setFieldMeta("email", (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: m.auth_email_taken() },
          }))
        } else {
          setFormError(m.error_generic())
        }
        return
      }
      // Signed in as an unverified user; the dashboard shows the verification banner.
      await router.navigate({ to: "/dashboard" })
    },
  })

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{m.auth_register_title()}</h1>
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
        <form.Field name="name">
          {(field) => <TextField field={field} label={m.auth_name()} autoComplete="name" />}
        </form.Field>
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
              {m.auth_register()}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className="text-sm text-muted-foreground">
        {m.auth_have_account()}{" "}
        <Link to="/login" className="text-primary underline-offset-4 hover:underline">
          {m.auth_sign_in()}
        </Link>
      </p>
    </section>
  )
}
