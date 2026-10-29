import { paraglideVitePlugin } from "@inlang/paraglide-js"
import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import { msw } from "msw/vite"
import { defineConfig, loadEnv } from "vite"

import { createEnvSchema } from "./src/shared/config/env.schema.ts"

export default defineConfig(({ mode }) => {
  // Fail dev and build early on missing, malformed or unexpected VITE_* values.
  createEnvSchema(mode).parse(loadEnv(mode, import.meta.dirname, "VITE_"))

  return {
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./src/app/routes",
        generatedRouteTree: "./src/app/routeTree.gen.ts",
      }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      // Keep options in sync with the `i18n:compile` script in package.json.
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/shared/i18n/paraglide",
        strategy: ["localStorage", "preferredLanguage", "baseLocale"],
      }),
      // Serves /mockServiceWorker.js for the dev mock API. `apply: "serve"` matters:
      // in worker-only mode the plugin would also emit the worker into dist.
      { ...msw({ mode: "worker-only" }), apply: "serve" },
    ],
    resolve: {
      tsconfigPaths: true,
    },
    build: {
      rolldownOptions: {
        output: {
          // Stable vendor chunks: app-only deploys keep framework code cached.
          codeSplitting: {
            groups: [
              {
                name: "react",
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 3,
              },
              { name: "tanstack", test: /[\\/]node_modules[\\/]@tanstack[\\/]/, priority: 2 },
              {
                name: "ui",
                test: /[\\/]node_modules[\\/](@base-ui|@floating-ui|sonner|lucide-react)[\\/]/,
                priority: 1,
              },
            ],
          },
        },
      },
    },
  }
})
