import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type AuthState = {
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

/**
 * Client-only demo stub. Replace with a real auth provider; never treat this
 * flag as a security boundary. Persisted to sessionStorage so it survives the
 * full-page reload Paraglide does on locale change.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: "auth-stub",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ isAuthenticated }) => ({ isAuthenticated }),
    },
  ),
)

/** Router-context view of auth; a getter so route guards never read a stale snapshot. */
export const authContext = {
  get isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated
  },
}

export type AuthContext = typeof authContext
