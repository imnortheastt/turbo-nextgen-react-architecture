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
})
