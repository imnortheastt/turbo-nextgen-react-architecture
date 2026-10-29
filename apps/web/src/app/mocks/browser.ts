import { setupWorker } from "msw/browser"

import { createMockHandlers } from "./handlers.ts"
import { createMockStore, DEMO_USER } from "./store.ts"

/** Development only: main.tsx imports this behind `import.meta.env.DEV` and `VITE_API_MOCK`. */
export async function startMockWorker(baseUrl: string): Promise<void> {
  const store = createMockStore(localStorage)
  await setupWorker(...createMockHandlers({ baseUrl, store })).start({
    onUnhandledFrame: "bypass",
  })
  console.info(
    `[mock api] Sign in with ${DEMO_USER.email} / ${DEMO_USER.password}. Reset the mock: localStorage.removeItem("msw-auth").`,
  )
}
