import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { Card, CardContent } from "@repo/ui/components/card"

import { HeaderControls } from "./HeaderControls.tsx"
import { PageTransition } from "./PageTransition.tsx"

/** Sign-in, registration and password pages: one centered card. */
export function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-3">
        <Link to="/" className="text-sm font-semibold">
          FSD Boilerplate
        </Link>
        <HeaderControls />
      </header>
      <PageTransition className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardContent>{children}</CardContent>
        </Card>
      </PageTransition>
    </div>
  )
}
