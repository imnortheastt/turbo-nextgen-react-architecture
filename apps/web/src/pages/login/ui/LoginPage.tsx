import { useRouter, useSearch } from "@tanstack/react-router"

import { safeRedirect } from "@/shared/lib"
import { useAuthStore } from "@/shared/model"
import { Button } from "@repo/ui/components/button"

export function LoginPage() {
  const router = useRouter()
  const { redirect } = useSearch({ from: "/login" })
  const login = useAuthStore((state) => state.login)

  async function handleLogin() {
    login()
    await router.invalidate()
    // safeRedirect only yields same-origin paths, so `?redirect=` can never leave the app.
    await router.navigate({ href: safeRedirect(redirect) })
  }

  return (
    <section className="flex max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-muted-foreground">Demo stub: no credentials required.</p>
      <Button onClick={() => void handleLogin()}>Sign in</Button>
    </section>
  )
}
