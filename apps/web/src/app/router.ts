import type { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"

import { NotFoundPage } from "@/pages/not-found"
import { authContext } from "@/shared/model"

import { RouteError } from "./layout/RouteError.tsx"
import { routeTree } from "./routeTree.gen.ts"

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient, auth: authContext },
    defaultPreload: "intent",
    // Let TanStack Query decide freshness for preloaded data.
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFoundPage,
    scrollRestoration: true,
  })
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
