import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { sessionQuery, useResendVerification } from "@/entities/session"
import { m } from "@/shared/i18n"
import { Button } from "@repo/ui/components/button"
import { toast } from "@repo/ui/components/sonner"

const RESEND_COOLDOWN_MS = 30_000

/** Nudges unverified users to confirm their email, with a rate-limited resend. */
export function VerifyEmailBanner() {
  const { data: user } = useQuery(sessionQuery)
  const resend = useResendVerification()
  const [coolingDown, setCoolingDown] = useState(false)

  useEffect(() => {
    if (!coolingDown) return
    const timer = setTimeout(() => setCoolingDown(false), RESEND_COOLDOWN_MS)
    return () => clearTimeout(timer)
  }, [coolingDown])

  if (!user || user.emailVerified) return null

  return (
    <output className="flex flex-wrap items-center gap-3 border-b bg-muted px-4 py-2 text-sm">
      <span>{m.verify_banner()}</span>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto"
        disabled={coolingDown || resend.isPending}
        onClick={() =>
          resend.mutate(undefined, {
            onSuccess: () => {
              toast.success(m.verify_sent())
              setCoolingDown(true)
            },
          })
        }
      >
        {m.verify_resend()}
      </Button>
    </output>
  )
}
