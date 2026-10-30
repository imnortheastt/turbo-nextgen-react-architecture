import { createRootRouteWithContext, HeadContent, Outlet } from "@tanstack/react-router"
import { NuqsAdapter } from "nuqs/adapters/tanstack-router"
import { lazy, Suspense } from "react"

import { NotFoundPage } from "@/pages/not-found"
import { useApplyAppearance, useResolvedMode } from "@/shared/model"
import { Toaster } from "@repo/ui/components/sonner"

import { PublicLayout } from "../layout/PublicLayout.tsx"
import type { RouterContext } from "../router-context.ts"

const Devtools = import.meta.env.DEV ? lazy(() => import("../devtools.tsx")) : () => null

// Layouts live in the pathless _public, _guest and _authenticated routes; the
// root only hosts app-wide providers.
export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { title: "FSD Boilerplate" },
      { name: "description", content: "Vite + React boilerplate in Feature-Sliced Design." },
    ],
  }),
  component: RootComponent,
  // Unknown URLs match no layout route, so give them the public shell.
  notFoundComponent: () => (
    <PublicLayout>
      <NotFoundPage />
    </PublicLayout>
  ),
})

function RootComponent() {
  useApplyAppearance()
  const resolvedMode = useResolvedMode()

  return (
    <NuqsAdapter>
      <HeadContent />
      <Outlet />
      <Toaster theme={resolvedMode} />
      <Suspense>
        <Devtools />
      </Suspense>
    </NuqsAdapter>
  )
}
