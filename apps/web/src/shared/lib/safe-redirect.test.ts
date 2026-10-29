import { describe, expect, it } from "vitest"

import { safeRedirect } from "./safe-redirect.ts"

describe("safeRedirect", () => {
  it.each(["/", "/dashboard", "/todos?page=2#top"])("keeps same-origin path %s", (path) => {
    expect(safeRedirect(path)).toBe(path)
  })

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "javascript:alert(1)",
    "dashboard",
    "",
    undefined,
    42,
  ])("falls back to / for %j", (value) => {
    expect(safeRedirect(value)).toBe("/")
  })

  it("uses the provided fallback", () => {
    expect(safeRedirect("https://evil.example", "/login")).toBe("/login")
  })
})
