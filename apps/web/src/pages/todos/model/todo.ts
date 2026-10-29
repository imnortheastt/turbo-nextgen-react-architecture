import { z } from "zod"

import { m } from "@/shared/i18n"
import type { Todo } from "@repo/api-client"

const TODO_TITLE_MAX_LENGTH = 200
export const TODO_STATUSES = ["all", "active", "done"] as const
export type TodoStatus = (typeof TODO_STATUSES)[number]

// Messages resolve once at module load; fine because setLocale() reloads the page.
export const createTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, m.todos_title_required())
    .max(TODO_TITLE_MAX_LENGTH, m.todos_title_too_long()),
})

export function filterTodos(todos: readonly Todo[], status: TodoStatus): Todo[] {
  if (status === "active") return todos.filter((todo) => !todo.done)
  if (status === "done") return todos.filter((todo) => todo.done)
  return [...todos]
}
