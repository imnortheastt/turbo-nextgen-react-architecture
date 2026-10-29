import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

import { createEnvSchema } from "./src/shared/config/env.schema.ts"

export default defineConfig(({ mode }) => {
  // Fail dev and build early on missing, malformed or unexpected VITE_* values.
  createEnvSchema(mode).parse(loadEnv(mode, process.cwd(), "VITE_"))

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
    ],
    resolve: {
      tsconfigPaths: true,
    },
  }
})
