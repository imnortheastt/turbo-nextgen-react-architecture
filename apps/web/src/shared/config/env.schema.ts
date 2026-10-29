import { z } from "zod"

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value)

// http(s) only; unlike z.httpUrl() this also accepts "localhost".
const webUrl = () => z.url({ protocol: /^https?$/ })

/**
 * Single source of truth for public `VITE_*` env. Strict at build time
 * (vite.config.ts): an unknown `VITE_*` key fails the build so secrets are never
 * inlined into the bundle by accident.
 */
export function createEnvSchema(mode: string) {
  return z.strictObject({
    VITE_API_URL: webUrl().refine(
      (url) => mode !== "production" || url.startsWith("https://"),
      "VITE_API_URL must use https in production builds",
    ),
    VITE_SENTRY_DSN: z.preprocess(emptyToUndefined, webUrl().optional()),
  })
}
