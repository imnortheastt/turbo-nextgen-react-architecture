import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { TodosPage, todoQueries } from "@/pages/todos"

// looseObject keeps keys owned by nuqs (e.g. ?status=) when the router navigates.
const todosSearchSchema = z.looseObject({
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .catch(undefined)
    .transform((page) => page ?? 1),
})

export const Route = createFileRoute("/todos")({
  validateSearch: todosSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(todoQueries.list(deps.page)),
  head: () => ({ meta: [{ title: "Todos · FSD Boilerplate" }] }),
  component: TodosPage,
})
