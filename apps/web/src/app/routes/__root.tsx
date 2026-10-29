import { createRootRouteWithContext, HeadContent, Outlet } from "@tanstack/react-router"
import { NuqsAdapter } from "nuqs/adapters/tanstack-router"
import { lazy, Suspense } from "react"

import { useApplyTheme, useResolvedMode } from "@/shared/model"
import { Toaster } from "@repo/ui/components/sonner"

import { AppLayout } from "../layout/AppLayout.tsx"
import type { RouterContext } from "../router-context.ts"

const Devtools = import.meta.env.DEV ? lazy(() => import("../devtools.tsx")) : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { title: "FSD Boilerplate" },
      { name: "description", content: "Vite + React boilerplate in Feature-Sliced Design." },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  useApplyTheme()
  const resolvedMode = useResolvedMode()

  return (
    <NuqsAdapter>
      <HeadContent />
      <AppLayout>
        <Outlet />
      </AppLayout>
      <Toaster theme={resolvedMode} />
      <Suspense>
        <Devtools />
      </Suspense>
    </NuqsAdapter>
  )
}
