import { describe, expect, it } from "vitest"

import { ApiError } from "@repo/api-client"

import { apiErrorCode } from "./error-code.ts"

describe("apiErrorCode", () => {
  it("reads a known code from the error body", () => {
    expect(apiErrorCode(new ApiError(401, { code: "invalid_credentials" }))).toBe(
      "invalid_credentials",
    )
  })

  it.each([
    new ApiError(401, { code: "made_up" }),
    new ApiError(500, "text"),
    new Error("x"),
    undefined,
  ])("returns undefined for %s", (error) => {
    expect(apiErrorCode(error)).toBeUndefined()
  })
})
