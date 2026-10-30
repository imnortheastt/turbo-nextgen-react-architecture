import { useQuery } from "@tanstack/react-query"
import { Link, useSearch } from "@tanstack/react-router"
import { useEffect, useRef } from "react"

import { sessionQuery, useVerifyEmail } from "@/entities/session"
import { m } from "@/shared/i18n"
import { buttonVariants } from "@repo/ui/components/button"

export function VerifyEmailPage() {
  const { token } = useSearch({ from: "/verify-email" })
  const { data: user } = useQuery(sessionQuery)
  const verifyEmail = useVerifyEmail()
  const { mutate } = verifyEmail
  // Verify links are single-use: submit once, even under StrictMode's double effects.
  const submitted = useRef(false)

  useEffect(() => {
    if (!token || submitted.current) return
    submitted.current = true
    mutate(token)
  }, [token, mutate])

  const failed = !token || verifyEmail.isError
  const next = user
    ? { to: "/dashboard" as const, label: m.auth_go_to_dashboard() }
    : { to: "/login" as const, label: m.auth_sign_in() }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{m.auth_verify_title()}</h1>
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {m.auth_link_invalid()}
        </p>
      ) : verifyEmail.isSuccess ? (
        <output className="block text-sm">{m.auth_verify_done()}</output>
      ) : (
        <output className="block text-sm text-muted-foreground">{m.auth_verify_pending()}</output>
      )}
      {(failed || verifyEmail.isSuccess) && (
        <Link to={next.to} className={buttonVariants({ className: "self-start" })}>
          {next.label}
        </Link>
      )}
    </section>
  )
}
