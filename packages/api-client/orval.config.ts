import { defineConfig } from "orval"

export default defineConfig({
  api: {
    input: { target: "./api/openapi.yaml" },
    output: {
      client: "react-query",
      httpClient: "fetch",
      mode: "tags-split",
      target: "./src/generated/endpoints.ts",
      schemas: "./src/generated/models",
      mock: false,
      // Wipes the output dirs on every run: keep them dedicated to Orval.
      clean: true,
      override: {
        mutator: { path: "./src/client.ts", name: "apiFetch" },
      },
    },
  },
})
