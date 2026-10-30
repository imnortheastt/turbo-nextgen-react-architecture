import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { sessionQuery } from "@/entities/session"
import { m } from "@/shared/i18n"
import { buttonVariants } from "@repo/ui/components/button"

import { AppearanceDrawer } from "./AppearanceDrawer.tsx"
import { PageTransition } from "./PageTransition.tsx"

const NAV_LINK = "text-muted-foreground hover:text-foreground [&.active]:text-foreground"

/** Marketing and public pages: top navigation, no sidebar. */
export function PublicLayout({ children }: { children: ReactNode }) {
  const { data: user } = useQuery(sessionQuery)

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-3 text-sm">
          <Link to="/" className={NAV_LINK} activeOptions={{ exact: true }}>
            {m.nav_home()}
          </Link>
          <Link to="/todos" className={NAV_LINK}>
            {m.nav_todos()}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <AppearanceDrawer />
            {user ? (
              <Link to="/dashboard" className={buttonVariants({ size: "sm" })}>
                {m.nav_dashboard()}
              </Link>
            ) : (
              <Link to="/login" className={buttonVariants({ size: "sm" })}>
                {m.auth_sign_in()}
              </Link>
            )}
          </div>
        </nav>
      </header>
      <PageTransition className="mx-auto max-w-4xl px-6 py-8">{children}</PageTransition>
    </div>
  )
}
