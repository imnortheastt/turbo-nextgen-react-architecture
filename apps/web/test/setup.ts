import { afterAll, afterEach, beforeAll, beforeEach } from "vitest"

import { configureApiClient, resetApiClient } from "@repo/api-client"

import { server, TEST_API_URL } from "./server.ts"

// MSW 3: unhandled requests fail the test instead of reaching the network.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
beforeEach(() => configureApiClient({ baseUrl: TEST_API_URL }))
afterEach(() => {
  server.resetHandlers()
  resetApiClient()
})
afterAll(() => server.close())
