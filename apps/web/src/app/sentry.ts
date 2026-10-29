import type { AnyRouter } from "@tanstack/react-router"

import { env } from "@/shared/config"

type ReactErrorInfo = { componentStack?: string }
type ReactErrorHandler = (error: unknown, errorInfo: ReactErrorInfo) => void

const URL_KEYS = ["url", "from", "to"] as const

let sentryErrorHandler: ReactErrorHandler | undefined

// Query strings can carry redirects, codes or tokens; keep them out of Sentry.
function stripQuery(url: string): string {
  const end = url.search(/[?#]/)
  return end === -1 ? url : url.slice(0, end)
}

/**
 * No-op unless VITE_SENTRY_DSN is set. The SDK is loaded on demand so builds
 * without a DSN ship none of it.
 */
export async function initSentry(router: AnyRouter): Promise<void> {
  if (!env.VITE_SENTRY_DSN) return

  const Sentry = await import("@sentry/react")
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Collect no user info, cookies, headers, bodies or query params.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    tracesSampleRate: 0.1,
    beforeBreadcrumb(breadcrumb) {
      const data = breadcrumb.data
      if (data) {
        for (const key of URL_KEYS) {
          const value = data[key]
          if (typeof value === "string") data[key] = stripQuery(value)
        }
      }
      return breadcrumb
    },
  })
  sentryErrorHandler = Sentry.reactErrorHandler()
}

/** React 19 root error hook: reports to Sentry once loaded, otherwise logs. */
export const reportReactError: ReactErrorHandler = (error, errorInfo) => {
  if (sentryErrorHandler) sentryErrorHandler(error, errorInfo)
  else console.error(error)
}
