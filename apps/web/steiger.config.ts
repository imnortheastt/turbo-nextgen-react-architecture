import fsd from "@feature-sliced/steiger-plugin"
import { defineConfig } from "steiger"

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Route files are thin TanStack Router glue; generated code is not authored.
    ignores: ["./src/app/routes/**", "**/*.gen.ts"],
  },
])
