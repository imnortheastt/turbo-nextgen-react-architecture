import { Link } from "@tanstack/react-router"

export function HomePage() {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">FSD Boilerplate</h1>
      <p className="text-muted-foreground">
        Vite + React SPA in Feature-Sliced Design, with TanStack Router and Query.
      </p>
      <Link to="/dashboard" className="text-primary underline-offset-4 hover:underline">
        Go to the protected dashboard
      </Link>
    </section>
  )
}
