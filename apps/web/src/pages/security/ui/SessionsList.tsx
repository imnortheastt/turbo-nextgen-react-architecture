import { useQuery } from "@tanstack/react-query"
import { MonitorSmartphoneIcon } from "lucide-react"
import { useState } from "react"

import { sessionsQuery, useRevokeOtherSessions, useRevokeSession } from "@/entities/session"
import { getLocale, m } from "@/shared/i18n"
import type { Session } from "@repo/api-client"
import { Button } from "@repo/ui/components/button"
import { Skeleton } from "@repo/ui/components/skeleton"

import { describeUserAgent } from "../lib/user-agent.ts"

const dateFormat = new Intl.DateTimeFormat(getLocale(), { dateStyle: "medium", timeStyle: "short" })

function deviceLabel(userAgent: string): string {
  const { browser, os } = describeUserAgent(userAgent)
  if (browser && os) return m.sessions_device({ browser, os })
  return browser ?? os ?? m.sessions_unknown_device()
}

export function SessionsList() {
  const { data: sessions, isPending, isError } = useQuery(sessionsQuery)
  const revokeOthers = useRevokeOtherSessions()
  const [confirming, setConfirming] = useState(false)
  const hasOthers = sessions?.some((session) => !session.current) ?? false

  return (
    <div className="flex flex-col gap-4">
      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">
          {m.error_generic()}
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
      )}
      {hasOthers &&
        (confirming ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              disabled={revokeOthers.isPending}
              onClick={() =>
                revokeOthers.mutate(undefined, { onSettled: () => setConfirming(false) })
              }
            >
              {m.sessions_revoke_confirm()}
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              {m.cancel()}
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="self-start" onClick={() => setConfirming(true)}>
            {m.sessions_revoke_others()}
          </Button>
        ))}
    </div>
  )
}

function SessionRow({ session }: { session: Session }) {
  const revoke = useRevokeSession()

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <MonitorSmartphoneIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 text-sm font-medium">
          {deviceLabel(session.userAgent)}
          {session.current && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {m.sessions_this_device()}
            </span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          {m.sessions_last_active({ date: dateFormat.format(new Date(session.lastSeenAt)) })}
        </span>
      </div>
      {/* The current session ends with "Sign out" below, which also clears local state. */}
      {!session.current && (
        <Button
          variant="ghost"
          size="sm"
          disabled={revoke.isPending}
          onClick={() => revoke.mutate(session.id)}
        >
          {m.sessions_revoke()}
        </Button>
      )}
    </li>
  )
}
