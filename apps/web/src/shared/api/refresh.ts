import { ApiError, refreshSession } from "@repo/api-client"

import { clearAccessToken, setAccessToken } from "./access-token.ts"

let inflight: Promise<string | undefined> | undefined

/**
 * Trades the httpOnly refresh cookie for a new access token. Resolves undefined
 * when the session is gone (401); other failures reject. Concurrent callers (a
 * 401 retry in apiFetch and the session bootstrap) share one request.
 */
export function refreshAccessToken(): Promise<string | undefined> {
  inflight ??= (async () => {
    try {
      // apiFetch never refreshes /auth/refresh itself, so this cannot recurse.
      const { data } = await refreshSession()
      setAccessToken(data.accessToken)
      return data.accessToken
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
      clearAccessToken()
      return undefined
    } finally {
      inflight = undefined
    }
  })()
  return inflight
}
