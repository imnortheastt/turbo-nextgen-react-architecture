import { MutationCache, QueryCache, QueryClient, type QueryKey } from "@tanstack/react-query"

import { m } from "@/shared/i18n"
import { ApiError } from "@repo/api-client"
import { toast } from "@repo/ui/components/sonner"

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Set to false when the form shows its own error, e.g. a wrong password. */
      errorToast?: boolean
    }
  }
}

const MAX_RETRIES = 2

/** The session query owns its own 401 (signed out); see entities/session. */
export const SESSION_QUERY_KEY = ["session"] as const

/** Client errors (4xx) are final; network and server errors retry. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

const isSessionKey = (key: QueryKey | undefined) => key?.[0] === SESSION_QUERY_KEY[0]

export type QueryClientOptions = {
  /**
   * Runs when a signed-in user's request is still 401 after the token refresh:
   * the session is gone. A 401 while signed out (e.g. a wrong password) is not this.
   */
  onUnauthorized?: () => void
}

export function createQueryClient({ onUnauthorized }: QueryClientOptions = {}): QueryClient {
  /** Returns true when the error meant "session gone" and was handled. */
  const handleUnauthorized = (error: unknown, key: QueryKey | undefined): boolean => {
    if (!(error instanceof ApiError) || error.status !== 401 || isSessionKey(key)) return false
    if (!client.getQueryData(SESSION_QUERY_KEY)) return false
    onUnauthorized?.()
    return true
  }

  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => handleUnauthorized(error, query.queryKey),
    }),
    // One place to surface failed writes; queries surface errors via route error components.
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (handleUnauthorized(error, mutation.options.mutationKey)) return
        if (mutation.meta?.errorToast === false) return
        toast.error(m.error_generic())
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 300_000,
        retry: shouldRetry,
      },
    },
  })
  return client
}
