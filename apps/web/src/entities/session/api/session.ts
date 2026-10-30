import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"

import {
  clearAccessToken,
  getAccessToken,
  refreshAccessToken,
  SESSION_QUERY_KEY,
  setAccessToken,
} from "@/shared/api"
import {
  ApiError,
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
  type AuthTokens,
  type ForgotPasswordRequest,
  type LoginRequest,
  type RegisterRequest,
  type ResetPasswordRequest,
  type User,
} from "@repo/api-client"

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

/** Stores a fresh sign-in: token in memory, user in the session cache. */
function useStartSession() {
  const queryClient = useQueryClient()
  return ({ accessToken, user }: AuthTokens) => {
    setAccessToken(accessToken)
    queryClient.setQueryData(sessionQuery.queryKey, user)
  }
}

export function useLogin() {
  const startSession = useStartSession()
  return useMutation({
    mutationFn: async (input: LoginRequest) => (await login(input)).data,
    onSuccess: startSession,
    // The form shows "invalid email or password" itself.
    meta: { errorToast: false },
  })
}

/** Creates an unverified account and signs it in; the API sends the verification email. */
export function useRegister() {
  const startSession = useStartSession()
  return useMutation({
    mutationFn: async (input: RegisterRequest) => (await register(input)).data,
    onSuccess: startSession,
    meta: { errorToast: false },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (input: ForgotPasswordRequest) => {
      await forgotPassword(input)
    },
    meta: { errorToast: false },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: ResetPasswordRequest) => {
      await resetPassword(input)
    },
    meta: { errorToast: false },
  })
}

export function useVerifyEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (token: string) => {
      await verifyEmail({ token })
    },
    // A signed-in user's `emailVerified` changed; signed out, this resolves to null.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey }),
    meta: { errorToast: false },
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async () => {
      await resendVerification()
    },
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
