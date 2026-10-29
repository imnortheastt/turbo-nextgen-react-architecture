import type { ErrorComponentProps } from "@tanstack/react-router"

import { Button } from "@repo/ui/components/button"

export function RouteError({ error, reset }: ErrorComponentProps) {
  return (
    <section role="alert" className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Unexpected error"}
      </p>
      <Button variant="outline" className="self-start" onClick={reset}>
        Try again
      </Button>
    </section>
  )
}
