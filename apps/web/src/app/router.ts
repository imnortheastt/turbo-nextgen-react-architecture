import type { QueryClient } from "@tanstack/react-query"
import { createRouter, type RouterHistory } from "@tanstack/react-router"

import { NotFoundPage } from "@/pages/not-found"
import { authContext } from "@/shared/model"

import { RouteError } from "./layout/RouteError.tsx"
import { routeTree } from "./routeTree.gen.ts"

/** `history` defaults to the browser history; tests pass a memory history. */
export function createAppRouter(queryClient: QueryClient, history?: RouterHistory) {
  return createRouter({
    routeTree,
    ...(history && { history }),
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
