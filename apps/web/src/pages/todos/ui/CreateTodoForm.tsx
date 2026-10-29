import { useForm } from "@tanstack/react-form"

import { m } from "@/shared/i18n"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { toast } from "@repo/ui/components/sonner"

import { useCreateTodo } from "../api/queries.ts"
import { createTodoSchema } from "../model/todo.ts"

export function CreateTodoForm() {
  const createTodo = useCreateTodo()
  const form = useForm({
    defaultValues: { title: "" },
    validators: { onSubmit: createTodoSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await createTodo.mutateAsync(createTodoSchema.parse(value))
      } catch {
        // Already reported by the QueryClient MutationCache; keep the input for a retry.
        return
      }
      formApi.reset()
      toast.success(m.todos_created())
    },
  })

  return (
    <form
      className="flex flex-col gap-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="title">
        {(field) => {
          const error = field.state.meta.errors[0]?.message
          return (
            <>
              <Label htmlFor={field.name}>{m.todos_new_label()}</Label>
              <div className="flex gap-2">
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  placeholder={m.todos_new_placeholder()}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${field.name}-error` : undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button type="submit" disabled={isSubmitting}>
                      {m.todos_add()}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
              {error && (
                <p id={`${field.name}-error`} className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </>
          )
        }}
      </form.Field>
    </form>
  )
}
