import { QueryClient } from "@tanstack/react-query"
import { http, HttpResponse } from "msw/http"
import { describe, expect, expectTypeOf, it } from "vitest"

import { ApiError, type TodoPage } from "@repo/api-client"

import { server, TEST_API_URL } from "../../../../test/server.ts"
import { todoQueries } from "./queries.ts"

const todoPage: TodoPage = {
  items: [{ id: "1", title: "Write the README", done: false }],
  page: 2,
  totalPages: 3,
}

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

describe("todoQueries.list (apiFetch + generated client + QueryClient)", () => {
  it("fetches a page and caches the unwrapped data", async () => {
    server.use(
      http.get(`${TEST_API_URL}/todos`, ({ request }) => {
        expect(new URL(request.url).searchParams.get("page")).toBe("2")
        return HttpResponse.json(todoPage)
      }),
    )

    const data = await createQueryClient().fetchQuery(todoQueries.list(2))

    expectTypeOf(data).toEqualTypeOf<TodoPage>()
    expect(data).toEqual(todoPage)
  })

  it("rejects with ApiError on server errors", async () => {
    server.use(
      http.get(`${TEST_API_URL}/todos`, () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    )

    const error = await createQueryClient()
      .fetchQuery(todoQueries.list(1))
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 500, body: { message: "boom" } })
  })
})
