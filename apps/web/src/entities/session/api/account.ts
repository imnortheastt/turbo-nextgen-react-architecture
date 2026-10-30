import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import {
  changePassword,
  getListSessionsQueryKey,
  listSessions,
  revokeOtherSessions,
  revokeSession,
  updateMe,
  type ChangePasswordRequest,
  type UpdateMeRequest,
} from "@repo/api-client"

import { sessionQuery } from "./session.ts"

/** The signed-in user's active sessions (one per signed-in device). */
export const sessionsQuery = queryOptions({
  queryKey: getListSessionsQueryKey(),
  queryFn: async ({ signal }) => (await listSessions({ signal })).data,
})

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateMeRequest) => (await updateMe(input)).data,
    // The response is the updated user: the header, sidebar and pages update at once.
    onSuccess: (user) => queryClient.setQueryData(sessionQuery.queryKey, user),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordRequest) => {
      await changePassword(input)
    },
    // The form shows "current password is incorrect" itself.
    meta: { errorToast: false },
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await revokeSession(id)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionsQuery.queryKey }),
  })
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await revokeOtherSessions()
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionsQuery.queryKey }),
  })
}
