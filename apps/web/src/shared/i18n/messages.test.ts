import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

// Paraglide silently falls back to the base locale for a missing key, so a
// forgotten translation would never fail the build: this test does.
const keysOf = (locale: string) => {
  const messages = JSON.parse(
    readFileSync(join(import.meta.dirname, `../../../messages/${locale}.json`), "utf8"),
  ) as Record<string, unknown>
  return Object.keys(messages)
    .filter((key) => key !== "$schema")
    .sort()
}

describe("i18n messages", () => {
  it("vi defines exactly the keys en defines", () => {
    expect(keysOf("vi")).toEqual(keysOf("en"))
  })
})
