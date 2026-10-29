import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import {
  createTodo,
  getListTodosQueryKey,
  listTodos,
  updateTodo,
  type CreateTodo,
} from "@repo/api-client"

export const todoQueries = {
  /** Prefix key for every todos query; use it to invalidate after writes. */
  all: () => getListTodosQueryKey(),
  list: (page: number) =>
    queryOptions({
      queryKey: getListTodosQueryKey({ page }),
      // Unwrap Orval's { data, status, headers } so the cache holds domain data.
      queryFn: async ({ signal }) => (await listTodos({ page }, { signal })).data,
    }),
}

export function useCreateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTodo) => (await createTodo(input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoQueries.all() }),
  })
}

export function useSetTodoDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) =>
      (await updateTodo(id, { done })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoQueries.all() }),
  })
}
