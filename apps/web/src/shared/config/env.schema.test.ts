import { describe, expect, it } from "vitest"

import { createEnvSchema } from "./env.schema.ts"

describe("createEnvSchema", () => {
  it("accepts a local http API in development", () => {
    const env = createEnvSchema("development").parse({ VITE_API_URL: "http://localhost:3000" })
    expect(env).toEqual({ VITE_API_URL: "http://localhost:3000", VITE_SENTRY_DSN: undefined })
  })

  it("requires https in production builds", () => {
    const result = createEnvSchema("production").safeParse({
      VITE_API_URL: "http://api.example.com",
    })
    expect(result.success).toBe(false)
  })

  it.each(["not-a-url", "javascript:alert(1)", "file:///etc/passwd"])("rejects %s", (value) => {
    expect(createEnvSchema("development").safeParse({ VITE_API_URL: value }).success).toBe(false)
  })

  it("treats an empty Sentry DSN as unset", () => {
    const env = createEnvSchema("production").parse({
      VITE_API_URL: "https://api.example.com",
      VITE_SENTRY_DSN: "",
    })
    expect(env.VITE_SENTRY_DSN).toBeUndefined()
  })

  it("rejects unknown VITE_* keys so secrets are not inlined by accident", () => {
    const result = createEnvSchema("production").safeParse({
      VITE_API_URL: "https://api.example.com",
      VITE_SENTRY_AUTH_TOKEN: "secret",
    })
    expect(result.success).toBe(false)
  })
})
