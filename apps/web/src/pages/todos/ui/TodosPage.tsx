import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, useSearch } from "@tanstack/react-router"

import { m } from "@/shared/i18n"
import { Button } from "@repo/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card"

import { todoQueries } from "../api/queries.ts"
import { filterTodos } from "../model/todo.ts"
import { CreateTodoForm } from "./CreateTodoForm.tsx"
import { StatusFilter, useStatusFilter } from "./StatusFilter.tsx"
import { TodoItem } from "./TodoItem.tsx"

export function TodosPage() {
  const { page } = useSearch({ from: "/todos" })
  const { data } = useSuspenseQuery(todoQueries.list(page))
  const [status] = useStatusFilter()
  const todos = filterTodos(data.items, status)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.todos_title()}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CreateTodoForm />
        <StatusFilter />
        {todos.length === 0 ? (
          <p className="text-sm text-muted-foreground">{m.todos_empty()}</p>
        ) : (
          <ul className="divide-y">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        )}
        <nav className="flex items-center justify-between text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            render={<Link from="/todos" search={(prev) => ({ ...prev, page: page - 1 })} />}
          >
            {m.todos_prev()}
          </Button>
          <span className="text-muted-foreground">
            {m.todos_page({ page: data.page, totalPages: data.totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            render={<Link from="/todos" search={(prev) => ({ ...prev, page: page + 1 })} />}
          >
            {m.todos_next()}
          </Button>
        </nav>
      </CardContent>
    </Card>
  )
}
