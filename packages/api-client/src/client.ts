export type ApiClientConfig = {
  baseUrl: string
  getToken?: () => string | undefined | Promise<string | undefined>
  /**
   * Called once when a request that carried a bearer token gets a 401. Returns
   * the new access token (or undefined when the session is gone). Must not use
   * `apiFetch` itself.
   */
  refresh?: (context: { baseUrl: string }) => Promise<string | undefined>
  /** Defaults to "include" so the API's httpOnly refresh cookie is sent. */
  credentials?: RequestCredentials
}

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

let config: ApiClientConfig | undefined
// Concurrent 401s share one refresh request.
let inflightRefresh: Promise<string | undefined> | undefined

export function configureApiClient(next: ApiClientConfig): void {
  config = next
}

export function resetApiClient(): void {
  config = undefined
  inflightRefresh = undefined
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  const isJson = response.headers.get("content-type")?.includes("json") ?? false
  return isJson ? JSON.parse(text) : text
}

function refreshOnce(current: ApiClientConfig): Promise<string | undefined> {
  inflightRefresh ??= (async () => {
    try {
      return await current.refresh?.({ baseUrl: current.baseUrl })
    } catch {
      return undefined
    } finally {
      inflightRefresh = undefined
    }
  })()
  return inflightRefresh
}

/**
 * Fetch function used by the Orval-generated client. `T` is Orval's response
 * wrapper ({ data, status, headers }); non-2xx responses throw ApiError so
 * TanStack Query takes its error path. A 401 on a request that carried a bearer
 * token triggers one refresh and one retry.
 */
export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const current = config
  if (!current) throw new Error("apiFetch called before configureApiClient()")

  const send = async (token: string | undefined) => {
    const headers = new Headers(init.headers)
    if (token) headers.set("Authorization", `Bearer ${token}`)
    return fetch(`${current.baseUrl.replace(/\/+$/, "")}${url}`, {
      credentials: current.credentials ?? "include",
      ...init,
      headers,
    })
  }

  const token = await current.getToken?.()
  let response = await send(token)

  if (response.status === 401 && token && current.refresh && url !== "/auth/refresh") {
    const refreshed = await refreshOnce(current)
    if (refreshed) response = await send(refreshed)
  }

  const data = await parseBody(response)
  if (!response.ok) throw new ApiError(response.status, data)

  return { data, status: response.status, headers: response.headers } as T
}
