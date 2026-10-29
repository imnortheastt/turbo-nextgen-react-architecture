import "@repo/ui/globals.css"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { createAppRouter } from "@/app/router.ts"
import { initSentry, reportReactError } from "@/app/sentry.ts"
import { createQueryClient } from "@/shared/api"
import { env } from "@/shared/config"
import { getLocale } from "@/shared/i18n"
import { configureApiClient } from "@repo/api-client"

document.documentElement.lang = getLocale()
configureApiClient({ baseUrl: env.VITE_API_URL })

const queryClient = createQueryClient()
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
