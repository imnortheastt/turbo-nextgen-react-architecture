import { parseAsStringLiteral, useQueryState } from "nuqs"

import { m } from "@/shared/i18n"
import { Button } from "@repo/ui/components/button"

import { TODO_STATUSES, type TodoStatus } from "../model/todo.ts"

const STATUS_LABELS: Record<TodoStatus, () => string> = {
  all: m.filter_all,
  active: m.filter_active,
  done: m.filter_done,
}

// Widget-local URL state lives in nuqs; loader-relevant params (page) use validateSearch.
// Demo only: filters the loaded page client-side because the example API has no status param.
export const statusParser = parseAsStringLiteral(TODO_STATUSES).withDefault("all")

export function useStatusFilter() {
  return useQueryState("status", statusParser)
}

export function StatusFilter() {
  const [status, setStatus] = useStatusFilter()

  return (
    <fieldset className="flex gap-1">
      <legend className="sr-only">{m.filter_label()}</legend>
      {TODO_STATUSES.map((value) => (
        <Button
          key={value}
          size="sm"
          variant={status === value ? "secondary" : "ghost"}
          aria-pressed={status === value}
          onClick={() => void setStatus(value)}
        >
          {STATUS_LABELS[value]()}
        </Button>
      ))}
    </fieldset>
  )
}
