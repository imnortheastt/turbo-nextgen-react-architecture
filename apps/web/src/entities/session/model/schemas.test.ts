import { describe, expect, it } from "vitest"

import {
  changePasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "./schemas.ts"

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

describe("registerSchema", () => {
  const valid = {
    name: " Ada ",
    email: "Ada@Example.com",
    password: "correct-horse",
    confirmPassword: "correct-horse",
  }

  it("trims the name and normalizes the email", () => {
    expect(registerSchema.parse(valid)).toMatchObject({ name: "Ada", email: "ada@example.com" })
  })

  it("reports mismatched passwords on confirmPassword", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "different" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"])
  })

  it.each([
    { password: "short", confirmPassword: "short" },
    { name: "   " },
    { password: "x".repeat(129), confirmPassword: "x".repeat(129) },
  ])("rejects %j", (override) => {
    expect(registerSchema.safeParse({ ...valid, ...override }).success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("requires matching passwords of at least 8 characters", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "new-password", confirmPassword: "new-password" })
        .success,
    ).toBe(true)
    expect(
      resetPasswordSchema.safeParse({ password: "new-password", confirmPassword: "new-passwort" })
        .success,
    ).toBe(false)
    expect(
      resetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" }).success,
    ).toBe(false)
  })
})

describe("changePasswordSchema", () => {
  it("requires the current password and a matching new one", () => {
    const valid = {
      currentPassword: "old",
      password: "new-password",
      confirmPassword: "new-password",
    }
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
    expect(changePasswordSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false)
    expect(changePasswordSchema.safeParse({ ...valid, confirmPassword: "nope-nope" }).success).toBe(
      false,
    )
  })
})

describe("profileSchema", () => {
  it("trims the name and rejects blanks", () => {
    expect(profileSchema.parse({ name: "  Ada  " })).toEqual({ name: "Ada" })
    expect(profileSchema.safeParse({ name: "   " }).success).toBe(false)
  })
})
