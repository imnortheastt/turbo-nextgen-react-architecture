import type { Todo } from "@repo/api-client"
import { Checkbox } from "@repo/ui/components/checkbox"
import { Label } from "@repo/ui/components/label"

import { useSetTodoDone } from "../api/queries.ts"

export function TodoItem({ todo }: { todo: Todo }) {
  const setDone = useSetTodoDone()
  const id = `todo-${todo.id}`

  return (
    <li className="flex items-center gap-3 py-2">
      <Checkbox
        id={id}
        checked={todo.done}
        disabled={setDone.isPending}
        onCheckedChange={(checked) => setDone.mutate({ id: todo.id, done: checked })}
      />
      <Label htmlFor={id} className={todo.done ? "text-muted-foreground line-through" : undefined}>
        {todo.title}
      </Label>
    </li>
  )
}
