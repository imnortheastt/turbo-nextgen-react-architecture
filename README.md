# FSD Boilerplate

A frontend starter: a React single-page app organized with [Feature-Sliced Design](https://feature-sliced.design) (FSD v2.1, pages-first), in a Bun + Turborepo monorepo with shared, source-only packages.

**Stack:** Vite 8 · React 19 + React Compiler · TypeScript 7 · TanStack Router / Query / Form · Zustand · nuqs · Zod 4 · Tailwind 4 + shadcn (Base UI) · Paraglide i18n · Orval · Vitest 5 + MSW · Oxlint + Oxfmt · Steiger · Knip · Lefthook + commitlint · Sentry · Docker + nginx.

## Quick start

Requirements: **Node 26** (see `.node-version`; Vitest and commitlint run on Node) and **Bun 1.4.4**.

```sh
bun install        # also installs git hooks (root `prepare` script)
bun run dev        # http://localhost:5173
```

No `.env` is needed for local development: `apps/web/.env.development` holds public defaults.

## Scripts (repo root)

| Script                                          | What it does                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `bun run dev`                                   | Compile i18n, start the Vite dev server                                                           |
| `bun run check`                                 | Everything CI runs locally: format check → lint (type-aware + Steiger) → typecheck → test → build |
| `bun run build` / `lint` / `typecheck` / `test` | Single Turborepo task across workspaces                                                           |
| `bun run format`                                | Format with Oxfmt                                                                                 |
| `bun run knip`                                  | Find unused files, exports and dependencies                                                       |
| `bunx turbo run api:gen`                        | Regenerate the API client from `packages/api-client/api/openapi.yaml`                             |

Always run tests with `bun run test` (Vitest). **Never `bun test`**: that is Bun's own runner and ignores the Vitest config.

## Repository map

```
apps/web/                 the SPA (FSD layers in src/)
packages/ui/              @repo/ui: shadcn components + Tailwind theme (globals.css, palettes)
packages/api-client/      @repo/api-client: OpenAPI spec, Orval output, apiFetch
packages/config/          @repo/config: shared tsconfig presets + oxlint base config
```

Packages are **source-only**: their `exports` point at `.ts`/`.tsx` files and the app's Vite compiles them (no build step). Import them directly from any FSD layer, like npm dependencies: `@repo/ui/components/button`, `@repo/api-client`.

## Architecture: Feature-Sliced Design (pages-first)

```
apps/web/src/
├─ app/        routes (TanStack file routes), router, providers, layout, sentry
├─ pages/      one slice per screen: home, login, dashboard, todos, not-found
├─ widgets/    (empty until needed)
├─ features/   (empty until needed)
├─ entities/   (empty until needed)
└─ shared/     config (env), api (QueryClient), lib, model (auth, theme), i18n
```

Rules, enforced by [Steiger](https://github.com/feature-sliced/steiger) in `bun run lint`:

- A layer may import only from layers below it: `app → pages → widgets → features → entities → shared`.
- Slices expose a public API (`index.ts`); import `@/pages/todos`, not its internals.
- **Pages first:** code starts inside the page that uses it (`pages/todos/{api,model,ui}`). Steiger's `insignificant-slice` rule fails lint for a widget, feature or entity used by only one place.

### Recipe: add a page

1. Create `src/pages/<name>/ui/<Name>Page.tsx` and `src/pages/<name>/index.ts` exporting it.
2. Add a thin route file `src/app/routes/<path>.tsx` (`createFileRoute(...)({ component })`). The dev server regenerates `src/app/routeTree.gen.ts`; commit it.

### Recipe: extract an entity, feature or widget

Only when a **second** page needs the same code:

1. Move it to `src/entities/<name>` (business object: model, api, ui), `src/features/<name>` (user action) or `src/widgets/<name>` (composed block), keeping the `api/`, `model/`, `ui/` segments.
2. Add an `index.ts` public API and import it from both pages.
3. `bun run lint`: Steiger checks layer direction and public APIs.

### Recipe: add an app

1. Create `apps/<name>/` with its own `package.json` (deps on `@repo/*` with `workspace:*`, `@repo/config` as devDependency), `tsconfig.json` extending `@repo/config/tsconfig/react-app.json`, and `.oxlintrc.json` extending `../../packages/config/oxlint/base.json`.
2. Add an `@source` line for its sources in `packages/ui/src/styles/globals.css` if it uses `@repo/ui`.
3. Add a workspace entry to `knip.json`, a `lint-<name>` command to `lefthook.yml` and, if it ships, a Dockerfile.

## Conventions

- **State.** Server data lives in TanStack Query (`queryOptions` in a page's `api/` segment). Client UI state lives in Zustand (`shared/model`).
- **URL state rule.** Search params that a route loader depends on (e.g. `?page=`) are declared with `validateSearch` (Zod). Widget-local UI state in the URL (filters, tabs, e.g. `?status=`) uses **nuqs**. Routes hosting nuqs state use `z.looseObject` so router navigation keeps nuqs keys.
- **API client.** Change `packages/api-client/api/openapi.yaml`, run `bunx turbo run api:gen`, and commit the output. Never edit `src/generated/**`; CI fails if it drifts from the spec. Orval's functions return `{ data, status, headers }`; unwrap `.data` in the `queryFn`. Non-2xx responses throw `ApiError`.
- **Errors.** Failed mutations show a toast (`MutationCache` in `shared/api`). Failed route loads render the route error component.
- **Zod + CSP.** Zod runs with `jitless: true` (`apps/web/src/app/setup-zod.ts`, imported first in `main.tsx`) so object schemas never probe `new Function` under the enforcing CSP; parsing is slightly slower, negligible at form/API payload sizes.
- **Forms.** TanStack Form with a Zod schema as the validator (`pages/todos/ui/CreateTodoForm.tsx`).
- **i18n.** Messages live in `apps/web/messages/{en,vi}.json`; use `m.<key>()` from `@/shared/i18n`. Locale is stored in localStorage; `setLocale()` reloads the page.
- **Theme.** Light/dark/system plus `data-palette` color palettes, stored in Zustand. `public/theme-init.js` applies them before first paint and must mirror `readPersistedTheme` in `shared/model/theme.ts`; the theme test runs it.
- **Tests: logic only.** Colocate tests as `*.test.ts` next to the code they cover, in the `node` environment. Add `// @vitest-environment happy-dom` only when a test needs browser APIs. API integration tests use MSW (`apps/web/test/server.ts`); unhandled requests fail. Coverage is reported without thresholds.
- **Commits.** Conventional Commits, checked by commitlint in the `commit-msg` hook. The pre-commit hook formats staged files and runs type-aware Oxlint per workspace.

## Environment variables

All `VITE_*` values are **public**: they are inlined into the JavaScript bundle. The schema in `apps/web/src/shared/config/env.schema.ts` is strict: an unknown `VITE_*` key, a malformed URL, or a non-https API URL in production fails the build.

| Variable          | Required | Notes                                                                                                                                                                                                                                     |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`    | yes      | API origin used by `@repo/api-client`. `.env.development` sets localhost; `.env.production` is only a placeholder that CI/Docker override.                                                                                                |
| `VITE_SENTRY_DSN` | no       | Enables Sentry. The SDK is loaded on demand only when this is set. The first pageload transaction, and errors thrown before the SDK loads, go only to the console. No user info, cookies, headers, bodies or query strings are collected. |

## Auth stub

`apps/web/src/shared/model/auth.ts` is a **client-only demo**: a flag in sessionStorage, not a security boundary. It shows the pattern to keep when you plug in real auth:

- router context getter + `_authenticated` route `beforeLoad` redirect
- `router.invalidate()` on login/logout
- `queryClient.clear()` on logout
- `safeRedirect()` for `?redirect=`

## Docker

```sh
docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com -t fsd-web .
docker run -p 8080:80 fsd-web
```

- **Build:** the image prunes the monorepo to `web` (`turbo prune --docker`), builds with Bun, and serves `dist` with nginx.
- **Build arg:** `VITE_API_URL` is required. It also becomes the only API origin allowed by the CSP `connect-src`.
- **nginx:** serves an SPA fallback, caches hashed `/assets/` forever, and sends `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and an **enforcing** Content-Security-Policy. HSTS belongs on your TLS terminator or CDN.

## Known chores

- **`shadcn add sonner`:** after adding or updating sonner, re-apply the edit in `packages/ui/src/components/sonner.tsx`: no `next-themes`, `theme` passed as a prop, `toast` re-exported.
- **Renovate generator bumps:** PRs that bump `orval` or `@tanstack/router-plugin` may change generated code. Run `bunx turbo run api:gen` / `bun run build` and commit the result.
- **Paraglide strategy:** it is set in two places that must match, the Vite plugin in `apps/web/vite.config.ts` and the `i18n:compile` script in `apps/web/package.json`.

## License

[MIT](./LICENSE)
