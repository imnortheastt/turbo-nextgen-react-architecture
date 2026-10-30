import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"

import { profileSchema, sessionQuery, useUpdateProfile } from "@/entities/session"
import { m } from "@/shared/i18n"
import { initials } from "@/shared/lib"
import { TextField } from "@/shared/ui"
import type { User } from "@repo/api-client"
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar"
import { Button } from "@repo/ui/components/button"
import { toast } from "@repo/ui/components/sonner"

export function ProfilePage() {
  const { data: user } = useQuery(sessionQuery)
  // The _authenticated guard guarantees a user; this only narrows the type.
  if (!user) return null

  return (
    <section className="flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            {user.email}
            <span
              className={
                user.emailVerified
                  ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  : "rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
              }
            >
              {user.emailVerified ? m.email_verified() : m.email_unverified()}
            </span>
          </span>
        </div>
      </div>
      <ProfileForm user={user} />
    </section>
  )
}

function ProfileForm({ user }: { user: User }) {
  const updateProfile = useUpdateProfile()
  const form = useForm({
    defaultValues: { name: user.name },
    validators: { onSubmit: profileSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const updated = await updateProfile.mutateAsync(profileSchema.parse(value))
        formApi.reset({ name: updated.name })
      } catch {
        // Reported by the QueryClient MutationCache; keep the input for a retry.
        return
      }
      toast.success(m.profile_saved())
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
      <form.Field name="name">
        {(field) => <TextField field={field} label={m.auth_name()} autoComplete="name" />}
      </form.Field>
      <form.Subscribe selector={(state) => [state.isSubmitting, state.isDirty] as const}>
        {([isSubmitting, isDirty]) => (
          <Button type="submit" className="self-start" disabled={isSubmitting || !isDirty}>
            {m.profile_save()}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
