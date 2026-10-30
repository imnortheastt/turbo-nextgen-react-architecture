import { useForm } from "@tanstack/react-form"

import { apiErrorCode, changePasswordSchema, useChangePassword } from "@/entities/session"
import { m } from "@/shared/i18n"
import { TextField } from "@/shared/ui"
import { Button } from "@repo/ui/components/button"
import { toast } from "@repo/ui/components/sonner"

export function ChangePasswordForm() {
  const changePassword = useChangePassword()
  const form = useForm({
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
    validators: { onSubmit: changePasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      const { currentPassword, password } = changePasswordSchema.parse(value)
      try {
        await changePassword.mutateAsync({ currentPassword, newPassword: password })
      } catch (error) {
        const message =
          apiErrorCode(error) === "wrong_password" ? m.security_wrong_password() : m.error_generic()
        formApi.setFieldMeta("currentPassword", (meta) => ({
          ...meta,
          errorMap: { ...meta.errorMap, onSubmit: message },
        }))
        return
      }
      formApi.reset()
      toast.success(m.security_password_changed())
    },
  })

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="currentPassword">
        {(field) => (
          <TextField
            field={field}
            label={m.security_current_password()}
            type="password"
            autoComplete="current-password"
          />
        )}
      </form.Field>
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
          <Button type="submit" className="self-start" disabled={isSubmitting}>
            {m.security_update_password()}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
