import { describe, expect, it } from "vitest"

import { loginSchema } from "./schemas.ts"

describe("loginSchema", () => {
  it("normalizes the email", () => {
    expect(loginSchema.parse({ email: "  Ada@Example.COM ", password: "x" })).toEqual({
      email: "ada@example.com",
      password: "x",
    })
  })

  it.each([
    { email: "not-an-email", password: "x" },
    { email: "ada@example.com", password: "" },
  ])("rejects %j", (input) => {
    expect(loginSchema.safeParse(input).success).toBe(false)
  })
})
