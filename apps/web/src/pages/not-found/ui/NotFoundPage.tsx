import { Link } from "@tanstack/react-router"

export function NotFoundPage() {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className="text-primary underline-offset-4 hover:underline">
        Back to home
      </Link>
    </section>
  )
}
