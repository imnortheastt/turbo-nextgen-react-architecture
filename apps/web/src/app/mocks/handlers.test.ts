import { describe, expect, it } from "vitest"

import { server, TEST_API_URL } from "../../../test/server.ts"
import { createMockHandlers, type MockEmail } from "./handlers.ts"
import { createMockStore, DEMO_USER } from "./store.ts"

/** Mock API under test, with a controllable clock and captured emails. */
function startMockApi() {
  const emails: MockEmail[] = []
  const clock = { now: 1_000_000 }
  server.use(
    ...createMockHandlers({
      baseUrl: TEST_API_URL,
      store: createMockStore(),
      accessTokenTtlMs: 30_000,
      onEmail: (email) => emails.push(email),
      now: () => clock.now,
    }),
  )
  return { emails, clock }
}

async function call(path: string, init: { method?: string; body?: unknown; token?: string } = {}) {
  const response = await fetch(`${TEST_API_URL}${path}`, {
    method: init.method ?? "POST",
    headers: {
      "content-type": "application/json",
      ...(init.token && { authorization: `Bearer ${init.token}` }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const text = await response.text()
  return {
    status: response.status,
    body: text ? (JSON.parse(text) as Record<string, any>) : undefined,
  }
}

const tokenFrom = (email: MockEmail | undefined) =>
  new URL(email?.link ?? "", "http://app").searchParams.get("token") ?? ""

describe("mock auth API", () => {
  it("registers, verifies, refreshes and signs out", async () => {
    const { emails, clock } = startMockApi()

    const registered = await call("/auth/register", {
      body: { name: "Ada", email: " Ada@Example.com ", password: "correct-horse" },
    })
    expect(registered.status).toBe(201)
    expect(registered.body?.user).toMatchObject({ email: "ada@example.com", emailVerified: false })
    expect(emails).toEqual([expect.objectContaining({ kind: "verify", to: "ada@example.com" })])

    const token = registered.body?.accessToken as string
    expect((await call("/me", { method: "GET", token })).body).toMatchObject({ name: "Ada" })

    expect(
      (await call("/auth/verify-email", { body: { token: tokenFrom(emails[0]) } })).status,
    ).toBe(204)
    // Re-submitting a used verify link is idempotent.
    expect(
      (await call("/auth/verify-email", { body: { token: tokenFrom(emails[0]) } })).status,
    ).toBe(204)
    expect((await call("/me", { method: "GET", token })).body?.emailVerified).toBe(true)

    clock.now += 31_000
    expect((await call("/me", { method: "GET", token })).status).toBe(401)

    const refreshed = await call("/auth/refresh")
    expect(refreshed.status).toBe(200)
    const fresh = refreshed.body?.accessToken as string
    expect((await call("/me", { method: "GET", token: fresh })).status).toBe(200)

    expect((await call("/auth/logout")).status).toBe(204)
    expect((await call("/auth/refresh")).status).toBe(401)
    expect((await call("/me", { method: "GET", token: fresh })).status).toBe(401)
  })

  it("rejects bad credentials and duplicate emails with error codes", async () => {
    startMockApi()

    const wrong = await call("/auth/login", {
      body: { email: DEMO_USER.email, password: "nope-nope" },
    })
    expect(wrong).toMatchObject({ status: 401, body: { code: "invalid_credentials" } })

    const taken = await call("/auth/register", {
      body: { name: "Demo", email: DEMO_USER.email, password: "password123" },
    })
    expect(taken).toMatchObject({ status: 409, body: { code: "email_taken" } })
  })

  it("answers forgot-password the same way for unknown emails, and resets with a valid token", async () => {
    const { emails } = startMockApi()

    expect(
      (await call("/auth/forgot-password", { body: { email: "nobody@example.com" } })).status,
    ).toBe(202)
    expect(emails).toHaveLength(0)
    expect((await call("/auth/forgot-password", { body: { email: DEMO_USER.email } })).status).toBe(
      202,
    )

    const token = tokenFrom(emails[0])
    expect(
      (await call("/auth/reset-password", { body: { token, password: "new-password" } })).status,
    ).toBe(204)
    expect(
      await call("/auth/reset-password", { body: { token, password: "again-again" } }),
    ).toMatchObject({
      status: 400,
      body: { code: "invalid_token" },
    })
    expect(
      (await call("/auth/login", { body: { email: DEMO_USER.email, password: "new-password" } }))
        .status,
    ).toBe(200)
  })

  it("lists sessions and revokes the others", async () => {
    startMockApi()
    const login = await call("/auth/login", { body: DEMO_USER })
    const token = login.body?.accessToken as string

    const sessions = (await call("/me/sessions", { method: "GET", token })).body as unknown as {
      current: boolean
    }[]
    expect(sessions).toHaveLength(3)
    expect(sessions.filter((session) => session.current)).toHaveLength(1)

    expect((await call("/me/sessions/revoke-others", { token })).status).toBe(204)
    const remaining = (await call("/me/sessions", { method: "GET", token })).body as unknown as {
      current: boolean
    }[]
    expect(remaining).toEqual([expect.objectContaining({ current: true })])
  })

  it("rejects a wrong current password on change", async () => {
    startMockApi()
    const token = (await call("/auth/login", { body: DEMO_USER })).body?.accessToken as string

    const result = await call("/me/password", {
      token,
      body: { currentPassword: "wrong-one", newPassword: "brand-new-pass" },
    })
    expect(result).toMatchObject({ status: 400, body: { code: "wrong_password" } })
  })
})
