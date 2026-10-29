import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    unstubGlobals: true,
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["src"],
      exclude: ["src/generated/**", "src/**/*.test.ts"],
    },
  },
})
