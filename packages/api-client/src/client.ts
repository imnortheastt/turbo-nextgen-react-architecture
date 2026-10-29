export type ApiClientConfig = {
  baseUrl: string
  getToken?: () => string | undefined | Promise<string | undefined>
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

export function configureApiClient(next: ApiClientConfig): void {
  config = next
}

export function resetApiClient(): void {
  config = undefined
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  const isJson = response.headers.get("content-type")?.includes("json") ?? false
  return isJson ? JSON.parse(text) : text
}

/**
 * Fetch function used by the Orval-generated client. `T` is Orval's response
 * wrapper ({ data, status, headers }); non-2xx responses throw ApiError so
 * TanStack Query takes its error path.
 */
export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  if (!config) throw new Error("apiFetch called before configureApiClient()")

  const headers = new Headers(init.headers)
  const token = await config.getToken?.()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}${url}`, { ...init, headers })
  const data = await parseBody(response)
  if (!response.ok) throw new ApiError(response.status, data)

  return { data, status: response.status, headers: response.headers } as T
}
