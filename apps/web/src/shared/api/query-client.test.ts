import { describe, expect, it, vi } from "vitest"

import { ApiError } from "@repo/api-client"

import { createQueryClient, SESSION_QUERY_KEY } from "./query-client.ts"

const unauthorized = () => Promise.reject(new ApiError(401, undefined))

describe("createQueryClient onUnauthorized", () => {
  it("fires when a signed-in user's request is still 401", async () => {
    const onUnauthorized = vi.fn()
    const client = createQueryClient({ onUnauthorized })
    client.setQueryData(SESSION_QUERY_KEY, { id: "1" })

    await client.fetchQuery({ queryKey: ["todos"], queryFn: unauthorized }).catch(() => {})
    await client
      .getMutationCache()
      .build(client, { mutationFn: unauthorized })
      .execute(undefined)
      .catch(() => {})

    expect(onUnauthorized).toHaveBeenCalledTimes(2)
  })

  it("ignores 401s while signed out, such as a wrong password", async () => {
    const onUnauthorized = vi.fn()
    const client = createQueryClient({ onUnauthorized })

    await client
      .getMutationCache()
      .build(client, { mutationFn: unauthorized, meta: { errorToast: false } })
      .execute(undefined)
      .catch(() => {})

    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it("ignores the session query's own 401", async () => {
    const onUnauthorized = vi.fn()
    const client = createQueryClient({ onUnauthorized })
    client.setQueryData(SESSION_QUERY_KEY, { id: "1" })

    await client.fetchQuery({ queryKey: SESSION_QUERY_KEY, queryFn: unauthorized }).catch(() => {})

    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
