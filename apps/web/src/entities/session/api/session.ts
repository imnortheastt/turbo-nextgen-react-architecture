import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"

import {
  clearAccessToken,
  getAccessToken,
  refreshAccessToken,
  SESSION_QUERY_KEY,
  setAccessToken,
} from "@/shared/api"
import { ApiError, getMe, login, logout, type LoginRequest, type User } from "@repo/api-client"

/**
 * The signed-in user, or null when signed out. Source of truth for route guards
 * and the UI. On a cold start (no access token in memory yet, e.g. after a
 * reload) it first restores the token from the refresh cookie.
 */
export const sessionQuery = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: async ({ signal }): Promise<User | null> => {
    if (!getAccessToken() && !(await refreshAccessToken())) return null
    try {
      return (await getMe({ signal })).data
    } catch (error) {
      // apiFetch already tried a refresh; a 401 here means signed out.
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  },
  retry: false,
  staleTime: 5 * 60_000,
})

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: LoginRequest) => (await login(input)).data,
    onSuccess: ({ accessToken, user }) => {
      setAccessToken(accessToken)
      queryClient.setQueryData(sessionQuery.queryKey, user)
    },
    // The form shows "invalid email or password" itself.
    meta: { errorToast: false },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async () => {
      try {
        await logout()
      } catch {
        // Sign out locally even if the API call fails.
      }
    },
    onSettled: async () => {
      clearAccessToken()
      queryClient.setQueryData(sessionQuery.queryKey, null)
      // Leave the protected page first: clearing the cache while its session
      // observers are mounted would refetch /me and trigger a refresh.
      await router.navigate({ to: "/login" })
      // Drop the previous user's cached server data.
      queryClient.clear()
      queryClient.setQueryData(sessionQuery.queryKey, null)
    },
  })
}
