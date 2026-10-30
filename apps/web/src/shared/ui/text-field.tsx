import type { AnyFieldApi } from "@tanstack/react-form"
import type { ComponentProps } from "react"

import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

/** Validators yield Zod issues ({ message }); server errors set with setFieldMeta are strings. */
function firstError(errors: readonly unknown[]): string | undefined {
  const error = errors[0]
  if (typeof error === "string") return error
  if (typeof error === "object" && error !== null && "message" in error) {
    return typeof error.message === "string" ? error.message : undefined
  }
  return undefined
}

type TextFieldProps = { field: AnyFieldApi; label: string } & Omit<
  ComponentProps<"input">,
  "id" | "name" | "value" | "onChange" | "onBlur"
>

/** Labelled input bound to a TanStack Form field, with its first error announced. */
export function TextField({ field, label, ...inputProps }: TextFieldProps) {
  const error = firstError(field.state.meta.errors)
  const errorId = `${field.name}-error`

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        {...inputProps}
        id={field.name}
        name={field.name}
        value={field.state.value as string}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
