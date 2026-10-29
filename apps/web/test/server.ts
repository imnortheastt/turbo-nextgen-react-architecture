import { setupServer } from "msw/node"

/** Shared MSW server; tests register their own handlers with `server.use(...)`. */
export const server = setupServer()

export const TEST_API_URL = "http://api.test"
