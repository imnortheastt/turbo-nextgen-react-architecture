import { http, HttpResponse } from "msw/http"
import { afterEach, describe, expect, it } from "vitest"

import { server, TEST_API_URL } from "../../../test/server.ts"
import { clearAccessToken, getAccessToken } from "./access-token.ts"
import { refreshAccessToken } from "./refresh.ts"

afterEach(() => clearAccessToken())

describe("refreshAccessToken", () => {
  it("stores the new access token and shares one request between concurrent callers", async () => {
    let hits = 0
    server.use(
      http.post(`${TEST_API_URL}/auth/refresh`, () => {
        hits += 1
        return HttpResponse.json({ accessToken: "fresh" })
      }),
    )

    const tokens = await Promise.all([refreshAccessToken(), refreshAccessToken()])

    expect(tokens).toEqual(["fresh", "fresh"])
    expect(hits).toBe(1)
    expect(getAccessToken()).toBe("fresh")
  })

  it("resolves undefined and clears the token when the session is gone (401)", async () => {
    server.use(
      http.post(`${TEST_API_URL}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    )

    await expect(refreshAccessToken()).resolves.toBeUndefined()
    expect(getAccessToken()).toBeUndefined()
  })

  it("rejects on other failures instead of signing the user out", async () => {
    server.use(
      http.post(`${TEST_API_URL}/auth/refresh`, () => new HttpResponse(null, { status: 503 })),
    )

    await expect(refreshAccessToken()).rejects.toMatchObject({ status: 503 })
  })
})
