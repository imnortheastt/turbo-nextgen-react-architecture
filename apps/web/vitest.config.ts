import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Logic-only tests run in node; DOM-dependent files opt in with
    // `// @vitest-environment happy-dom`.
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    unstubGlobals: true,
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["src"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.tsx",
        "src/**/index.ts",
        "src/app/routeTree.gen.ts",
        "src/shared/i18n/paraglide/**",
      ],
    },
  },
})
