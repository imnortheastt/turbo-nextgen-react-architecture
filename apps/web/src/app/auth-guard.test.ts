// The router only follows guard redirects in a DOM; same origin as the API so
// happy-dom sends no CORS preflight for credentialed requests.
// @vitest-environment happy-dom
// @vitest-environment-options {"url":"http://api.test/"}
import { createMemoryHistory } from "@tanstack/react-router"
import { http, HttpResponse } from "msw/http"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createQueryClient,
  getAccessToken,
  refreshAccessToken,
  clearAccessToken,
} from "@/shared/api"
import { configureApiClient } from "@repo/api-client"

import { server, TEST_API_URL } from "../../test/server.ts"
import { createMockHandlers } from "./mocks/handlers.ts"
import { createMockStore, DEMO_USER } from "./mocks/store.ts"
import { createAppRouter } from "./router.ts"

const clock = { now: 1_000_000 }
const requests: string[] = []

beforeEach(() => {
  clock.now = 1_000_000
  requests.length = 0
  configureApiClient({
    baseUrl: TEST_API_URL,
    getToken: getAccessToken,
    refresh: refreshAccessToken,
  })
  server.use(
    ...createMockHandlers({
      baseUrl: TEST_API_URL,
      store: createMockStore(),
      onEmail: () => {},
      now: () => clock.now,
    }),
  )
  server.events.on("request:start", ({ request }) => {
    requests.push(`${request.method} ${new URL(request.url).pathname}`)
  })
})

afterEach(() => {
  server.events.removeAllListeners()
  clearAccessToken()
})

async function signIn() {
  const response = await fetch(`${TEST_API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(DEMO_USER),
  })
  const { accessToken } = (await response.json()) as { accessToken: string }
  return accessToken
}

async function loadAt(path: string, onUnauthorized?: () => void) {
  const queryClient = createQueryClient({ onUnauthorized })
  const router = createAppRouter(queryClient, createMemoryHistory({ initialEntries: [path] }))
  await router.load()
  return { router, queryClient }
}

const count = (entry: string) => requests.filter((request) => request === entry).length

describe("_authenticated route guard", () => {
  it("redirects signed-out users to /login with a redirect back", async () => {
    const { router } = await loadAt("/dashboard")

    expect(router.state.location.pathname).toBe("/login")
    expect(router.state.location.search).toEqual({ redirect: "/dashboard" })
  })

  it("restores the session from the refresh cookie on a cold start (e.g. after a reload)", async () => {
    await signIn() // sets the mock's refresh cookie; the access token is not kept in memory

    const { router } = await loadAt("/dashboard")

    expect(router.state.location.pathname).toBe("/dashboard")
    expect(getAccessToken()).toBeDefined()
    expect(count("POST /auth/refresh")).toBe(1)
    expect(count("GET /me")).toBe(1)
  })

  it("refreshes an expired access token silently, once", async () => {
    await signIn()
    const { router, queryClient } = await loadAt("/dashboard")
    clock.now += 31_000 // past the mock's 30 s access-token TTL

    // The guard reads the cached session; refetching it is what hits the expired token.
    await queryClient.refetchQueries({ queryKey: ["session"] })
    await router.invalidate()

    expect(router.state.location.pathname).toBe("/dashboard")
    expect(count("POST /auth/refresh")).toBe(2) // cold start + expiry
  })

  it("sends the user to /login when the refresh cookie is gone, without looping", async () => {
    await signIn()
    const onUnauthorized = vi.fn()
    const { router, queryClient } = await loadAt("/dashboard", onUnauthorized)

    // The session ends elsewhere: the refresh token is revoked and the access token expires.
    await fetch(`${TEST_API_URL}/auth/logout`, { method: "POST" })
    clock.now += 31_000
    requests.length = 0

    await queryClient.refetchQueries({ queryKey: ["session"] })
    await router.invalidate()

    expect(router.state.location.pathname).toBe("/login")
    expect(count("POST /auth/refresh")).toBe(1)
    expect(onUnauthorized).not.toHaveBeenCalled() // the session query handles its own 401
  })

  it("reports a data request that is still 401 after the refresh as an expired session", async () => {
    await signIn()
    const onUnauthorized = vi.fn()
    const { queryClient } = await loadAt("/dashboard", onUnauthorized)
    await fetch(`${TEST_API_URL}/auth/logout`, { method: "POST" })
    clock.now += 31_000
    server.use(
      http.get(`${TEST_API_URL}/protected`, ({ request }) =>
        request.headers.get("authorization")
          ? new HttpResponse(null, { status: 401 })
          : HttpResponse.json({}),
      ),
    )

    await queryClient
      .fetchQuery({
        queryKey: ["protected"],
        queryFn: async () => {
          const { apiFetch } = await import("@repo/api-client")
          return apiFetch("/protected")
        },
      })
      .catch(() => {})

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})

describe("_guest route guard", () => {
  it("sends signed-in users from /login to /dashboard", async () => {
    await signIn()

    const { router } = await loadAt("/login")

    expect(router.state.location.pathname).toBe("/dashboard")
  })

  it("shows /login to signed-out users", async () => {
    const { router } = await loadAt("/login?redirect=%2Ftodos")

    expect(router.state.location.pathname).toBe("/login")
    expect(router.state.location.search).toEqual({ redirect: "/todos" })
  })
})

describe("_public routes", () => {
  it.each(["/", "/todos"])("render %s for signed-out users without redirecting", async (path) => {
    server.use(
      http.get(`${TEST_API_URL}/todos`, () =>
        HttpResponse.json({ items: [], page: 1, totalPages: 1 }),
      ),
    )

    const { router } = await loadAt(path)

    expect(router.state.location.pathname).toBe(path)
  })
})
