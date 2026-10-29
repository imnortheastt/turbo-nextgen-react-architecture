import { createEnvSchema } from "./env.schema.ts"

export const env = createEnvSchema(import.meta.env.MODE).parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_API_MOCK: import.meta.env.VITE_API_MOCK,
})
