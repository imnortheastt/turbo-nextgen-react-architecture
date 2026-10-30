import { useLogout } from "@/entities/session"
import { m } from "@/shared/i18n"
import { Button } from "@repo/ui/components/button"

import { ChangePasswordForm } from "./ChangePasswordForm.tsx"
import { SessionsList } from "./SessionsList.tsx"

export function SecurityPage() {
  const logout = useLogout()

  return (
    <div className="flex max-w-lg flex-col gap-10">
      <section className="flex flex-col gap-4" aria-labelledby="password-heading">
        <h2 id="password-heading" className="text-lg font-semibold">
          {m.security_password_title()}
        </h2>
        <ChangePasswordForm />
      </section>
      <section className="flex flex-col gap-4" aria-labelledby="sessions-heading">
        <div className="flex flex-col gap-1">
          <h2 id="sessions-heading" className="text-lg font-semibold">
            {m.sessions_title()}
          </h2>
          <p className="text-sm text-muted-foreground">{m.sessions_description()}</p>
        </div>
        <SessionsList />
      </section>
      <section className="flex flex-col gap-4" aria-labelledby="sign-out-heading">
        <h2 id="sign-out-heading" className="text-lg font-semibold">
          {m.sign_out()}
        </h2>
        <Button
          variant="outline"
          className="self-start"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {m.sign_out()}
        </Button>
      </section>
    </div>
  )
}
