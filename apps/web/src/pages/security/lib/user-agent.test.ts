import { describe, expect, it } from "vitest"

import { describeUserAgent } from "./user-agent.ts"

describe("describeUserAgent", () => {
  it.each([
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0 Safari/537.36",
      { browser: "Chrome", os: "macOS" },
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1",
      { browser: "Safari", os: "iOS" },
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0 Safari/537.36 Edg/150.0",
      { browser: "Edge", os: "Windows" },
    ],
    [
      "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
      { browser: "Firefox", os: "Linux" },
    ],
    ["Unknown device", { browser: undefined, os: undefined }],
  ])("%s", (userAgent, expected) => {
    expect(describeUserAgent(userAgent)).toEqual(expected)
  })
})
