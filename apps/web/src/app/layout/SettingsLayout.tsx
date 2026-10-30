import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { m } from "@/shared/i18n"

const TAB =
  "border-b-2 border-transparent px-1 pb-2 text-sm text-muted-foreground hover:text-foreground [&.active]:border-primary [&.active]:text-foreground"

/** Settings pages share a heading and tab navigation. */
export function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{m.nav_settings()}</h1>
      <nav aria-label={m.nav_settings()} className="flex gap-4 border-b">
        <Link to="/settings/profile" className={TAB}>
          {m.nav_profile()}
        </Link>
        <Link to="/settings/security" className={TAB}>
          {m.nav_security()}
        </Link>
      </nav>
      {children}
    </div>
  )
}
