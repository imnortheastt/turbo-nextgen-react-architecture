import { describe, expect, it } from "vitest"

import { initials } from "./initials.ts"

describe("initials", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["  grace  brewster murray hopper ", "GH"],
    ["Linh", "L"],
    ["Đặng Thu", "ĐT"],
    ["", "?"],
  ])("%j → %s", (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
