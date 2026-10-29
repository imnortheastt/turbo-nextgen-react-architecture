import { MutationCache, QueryClient } from "@tanstack/react-query"

import { m } from "@/shared/i18n"
import { ApiError } from "@repo/api-client"
import { toast } from "@repo/ui/components/sonner"

const MAX_RETRIES = 2

/** Client errors (4xx) are final; network and server errors retry. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    // One place to surface failed writes; queries surface errors via route error components.
    mutationCache: new MutationCache({
      onError: () => {
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
}
