import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@repo/api-client"

const MAX_RETRIES = 2

/** Client errors (4xx) are final; network and server errors retry. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 300_000,
        retry: shouldRetry,
      },
    },
  })
}
