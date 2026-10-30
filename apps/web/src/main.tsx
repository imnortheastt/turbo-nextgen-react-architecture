// Must stay the first import: configures Zod before any schema is built (see setup-zod.ts).
import "@/app/setup-zod.ts"
import "@repo/ui/globals.css"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { createAppRouter } from "@/app/router.ts"
import { initSentry, reportReactError } from "@/app/sentry.ts"
import {
  createQueryClient,
  getAccessToken,
  refreshAccessToken,
  SESSION_QUERY_KEY,
} from "@/shared/api"
import { env } from "@/shared/config"
import { getLocale, m } from "@/shared/i18n"
import { configureApiClient } from "@repo/api-client"
import { toast } from "@repo/ui/components/sonner"

document.documentElement.lang = getLocale()
configureApiClient({
  baseUrl: env.VITE_API_URL,
  getToken: getAccessToken,
  refresh: refreshAccessToken,
})

// The DEV check is a build-time constant, so production bundles drop the mock entirely.
if (import.meta.env.DEV && env.VITE_API_MOCK) {
  const { startMockWorker } = await import("@/app/mocks/browser.ts")
  await startMockWorker(env.VITE_API_URL)
}

const queryClient = createQueryClient({
  // A signed-in request is still 401 after the refresh: the session ended elsewhere.
  onUnauthorized: () => {
    queryClient.setQueryData(SESSION_QUERY_KEY, null)
    toast.warning(m.session_expired())
    // Re-runs route guards, which send the user to /login?redirect=… . `router` is
    // declared below; this only runs after a request has failed, long after setup.
    void router.invalidate()
  },
})
const router = createAppRouter(queryClient)
void initSentry(router)

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Root element #root not found")

createRoot(rootElement, {
  onUncaughtError: reportReactError,
  onCaughtError: reportReactError,
  onRecoverableError: reportReactError,
}).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
