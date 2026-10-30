import { afterEach, describe, expect, it, vi } from "vitest"

import { ApiError, apiFetch, configureApiClient, resetApiClient } from "./client.ts"

type Wrapped<T> = { data: T; status: number; headers: Headers }

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response)
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })

afterEach(() => {
  resetApiClient()
})

describe("apiFetch", () => {
  it("prefixes the base URL and returns the Orval response wrapper", async () => {
    configureApiClient({ baseUrl: "http://api.test/" })
    const fetchMock = stubFetch(json([{ id: 1 }]))

    const result = await apiFetch<Wrapped<{ id: number }[]>>("/todos")

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://api.test/todos")
    expect(result.status).toBe(200)
    expect(result.data).toEqual([{ id: 1 }])
  })

  it("throws ApiError with status and parsed body on non-2xx responses", async () => {
    configureApiClient({ baseUrl: "http://api.test" })
    stubFetch(json({ message: "nope" }, 404))

    const error = await apiFetch("/todos").catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, body: { message: "nope" }, message: "HTTP 404" })
  })

  it("sends Authorization only when getToken returns a value", async () => {
    configureApiClient({ baseUrl: "http://api.test", getToken: () => undefined })
    const withoutToken = stubFetch(json({}))
    await apiFetch("/me")
    expect(new Headers(withoutToken.mock.calls[0]?.[1]?.headers).has("Authorization")).toBe(false)

    configureApiClient({ baseUrl: "http://api.test", getToken: async () => "abc" })
    const withToken = stubFetch(json({}))
    await apiFetch("/me")
    expect(new Headers(withToken.mock.calls[0]?.[1]?.headers).get("Authorization")).toBe(
      "Bearer abc",
    )
  })

  it("passes the abort signal through to fetch", async () => {
    configureApiClient({ baseUrl: "http://api.test" })
    const fetchMock = stubFetch(json({}))
    const controller = new AbortController()

    await apiFetch("/todos", { signal: controller.signal })

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
  })

  it("fails fast when the client is not configured", async () => {
    await expect(apiFetch("/todos")).rejects.toThrow("configureApiClient")
  })

  it("sends credentials so the refresh cookie reaches the API", async () => {
    configureApiClient({ baseUrl: "http://api.test" })
    const fetchMock = stubFetch(json({}))

    await apiFetch("/me")

    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("include")
  })
})

describe("apiFetch token refresh", () => {
  /** Answers 401 for the expired token and 200 for anything else. */
  function stubAuthApi() {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      new Headers(init?.headers).get("Authorization") === "Bearer expired"
        ? json({ message: "Unauthorized" }, 401)
        : json({ ok: true }),
    )
    vi.stubGlobal("fetch", fetchMock)
    return fetchMock
  }

  it("refreshes once for concurrent 401s and retries each request with the new token", async () => {
    const fetchMock = stubAuthApi()
    const refresh = vi.fn(async () => "fresh")
    configureApiClient({ baseUrl: "http://api.test", getToken: () => "expired", refresh })

    const results = await Promise.all([
      apiFetch<Wrapped<unknown>>("/me"),
      apiFetch<Wrapped<unknown>>("/me/sessions"),
    ])

    expect(results.map((result) => result.status)).toEqual([200, 200])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledWith({ baseUrl: "http://api.test" })
    const retried = fetchMock.mock.calls
      .slice(2)
      .map(([, init]) => new Headers(init?.headers).get("Authorization"))
    expect(retried).toEqual(["Bearer fresh", "Bearer fresh"])
  })

  it("throws the original 401 when the refresh fails, without retrying", async () => {
    const fetchMock = stubAuthApi()
    configureApiClient({
      baseUrl: "http://api.test",
      getToken: () => "expired",
      refresh: async () => undefined,
    })

    const error = await apiFetch("/me").catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("treats a throwing refresh as a failed refresh", async () => {
    stubAuthApi()
    configureApiClient({
      baseUrl: "http://api.test",
      getToken: () => "expired",
      refresh: async () => {
        throw new Error("network down")
      },
    })

    await expect(apiFetch("/me")).rejects.toMatchObject({ status: 401 })
  })

  it("never refreshes a 401 for a request without a bearer token (e.g. a wrong password)", async () => {
    stubFetch(json({ code: "invalid_credentials" }, 401))
    const refresh = vi.fn(async () => "fresh")
    configureApiClient({ baseUrl: "http://api.test", refresh })

    await expect(apiFetch("/auth/login", { method: "POST" })).rejects.toMatchObject({ status: 401 })
    expect(refresh).not.toHaveBeenCalled()
  })

  it("retries at most once when the new token is rejected too", async () => {
    const fetchMock = stubFetch(json({ message: "Unauthorized" }, 401))
    fetchMock.mockImplementation(async () => json({ message: "Unauthorized" }, 401))
    const refresh = vi.fn(async () => "also-rejected")
    configureApiClient({ baseUrl: "http://api.test", getToken: () => "expired", refresh })

    await expect(apiFetch("/me")).rejects.toMatchObject({ status: 401 })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
