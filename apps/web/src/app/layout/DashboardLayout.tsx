import type { ReactNode } from "react"

import { m } from "@/shared/i18n"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/components/sidebar"

import { AppearanceDrawer } from "./AppearanceDrawer.tsx"
import { AppSidebar } from "./AppSidebar.tsx"
import { PageTransition } from "./PageTransition.tsx"
import { UserMenu } from "./UserMenu.tsx"
import { VerifyEmailBanner } from "./VerifyEmailBanner.tsx"

/** Signed-in area: collapsible sidebar (a sheet on mobile) plus a header with the user menu. */
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        {m.skip_to_content()}
      </a>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" aria-label={m.sidebar_toggle()} />
          <div className="ml-auto flex items-center gap-2">
            <AppearanceDrawer />
            <UserMenu />
          </div>
        </header>
        <VerifyEmailBanner />
        <PageTransition className="flex-1 p-6">{children}</PageTransition>
      </SidebarInset>
    </SidebarProvider>
  )
}
