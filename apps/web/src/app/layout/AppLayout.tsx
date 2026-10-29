import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

const NAV_LINK = "text-muted-foreground hover:text-foreground [&.active]:text-foreground"

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-3 text-sm">
          <Link to="/" className={NAV_LINK} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/dashboard" className={NAV_LINK}>
            Dashboard
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  )
}
