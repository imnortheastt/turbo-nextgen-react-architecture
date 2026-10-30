import { createMockHandlers } from "../src/app/mocks/handlers.ts"
import { createMockStore } from "../src/app/mocks/store.ts"
import { server, TEST_API_URL } from "./server.ts"

export { DEMO_USER } from "../src/app/mocks/store.ts"

/**
 * Serves the dev mock API (src/app/mocks) from the test MSW server. Lives
 * outside src so tests in any FSD layer can use it without importing `app`.
 */
export function serveMockApi() {
  server.use(
    ...createMockHandlers({ baseUrl: TEST_API_URL, store: createMockStore(), onEmail: () => {} }),
  )
}
