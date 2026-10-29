// @vitest-environment happy-dom
import { createMemoryHistory } from "@tanstack/react-router"
import { beforeEach, describe, expect, it } from "vitest"

import { createQueryClient } from "@/shared/api"
import { useAuthStore } from "@/shared/model"

import { createAppRouter } from "./router.ts"

async function loadAt(path: string) {
  const router = createAppRouter(
    createQueryClient(),
    createMemoryHistory({ initialEntries: [path] }),
  )
  await router.load()
  return router
}

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: false })
})

describe("_authenticated route guard", () => {
  it("redirects signed-out users to /login with a redirect back", async () => {
    const router = await loadAt("/dashboard")

    expect(router.state.location.pathname).toBe("/login")
    expect(router.state.location.search).toEqual({ redirect: "/dashboard" })
  })

  it("lets signed-in users through", async () => {
    useAuthStore.getState().login()

    const router = await loadAt("/dashboard")

    expect(router.state.location.pathname).toBe("/dashboard")
  })

  it("re-runs the guard on invalidate after sign-out", async () => {
    useAuthStore.getState().login()
    const router = await loadAt("/dashboard")

    useAuthStore.getState().logout()
    await router.invalidate()

    expect(router.state.location.pathname).toBe("/login")
  })
})
