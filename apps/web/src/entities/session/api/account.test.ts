import { QueryClient } from "@tanstack/react-query"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { clearAccessToken, getAccessToken, refreshAccessToken, setAccessToken } from "@/shared/api"
import { configureApiClient, login } from "@repo/api-client"

import { DEMO_USER, serveMockApi } from "../../../../test/mock-api.ts"
import { TEST_API_URL } from "../../../../test/server.ts"
import { sessionsQuery } from "./account.ts"

beforeEach(() => {
  configureApiClient({
    baseUrl: TEST_API_URL,
    getToken: getAccessToken,
    refresh: refreshAccessToken,
  })
  serveMockApi()
})

afterEach(() => clearAccessToken())

describe("sessionsQuery (against the mock API)", () => {
  it("lists this device and the other signed-in devices", async () => {
    setAccessToken((await login(DEMO_USER)).data.accessToken)

    const sessions = await new QueryClient().fetchQuery(sessionsQuery)

    expect(sessions.filter((session) => session.current)).toHaveLength(1)
    expect(sessions.filter((session) => !session.current).length).toBeGreaterThan(0)
  })
})
