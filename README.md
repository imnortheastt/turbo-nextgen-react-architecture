# FSD Boilerplate

A frontend starter: a React single-page app organized with [Feature-Sliced Design](https://feature-sliced.design) (FSD v2.1, pages-first), in a Bun + Turborepo monorepo with shared, source-only packages.

**Stack:** Vite 8 · React 19 + React Compiler · TypeScript 7 · TanStack Router / Query / Form · Zustand · nuqs · Zod 4 · Tailwind 4 + shadcn (Base UI) · Paraglide i18n · Orval · Vitest 5 + MSW · Oxlint + Oxfmt · Steiger · Knip · Lefthook + commitlint · Sentry · Docker + nginx.

## Quick start

Requirements: **Node 26** (see `.node-version`; Vitest and commitlint run on Node) and **Bun 1.4.4**.

```sh
bun install        # also installs git hooks (root `prepare` script)
bun run dev        # http://localhost:5173
```

No `.env` and no backend are needed for local development. `apps/web/.env.development` holds public defaults and turns on the in-browser mock API (`VITE_API_MOCK=true`). Sign in with `demo@example.com` / `password123`, or register a new account; see [Dev mock API](#dev-mock-api).

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
├─ app/        routes (TanStack file routes), router, layouts, dev mock API, sentry
├─ pages/      one slice per screen: home, todos, login, register, forgot-password,
│              reset-password, verify-email, dashboard, profile, security, not-found
├─ widgets/    (empty until needed)
├─ features/   (empty until needed)
├─ entities/   session: current user, auth and account queries/mutations, form schemas
└─ shared/     config (env), api (QueryClient, access token, refresh), lib,
               model (appearance), ui (TextField), i18n
```

Rules, enforced by [Steiger](https://github.com/feature-sliced/steiger) in `bun run lint`:

- A layer may import only from layers below it: `app → pages → widgets → features → entities → shared`.
- Slices expose a public API (`index.ts`); import `@/pages/todos`, not its internals.
- **Pages first:** code starts inside the page that uses it (`pages/todos/{api,model,ui}`). Steiger's `insignificant-slice` rule fails lint for a widget, feature or entity used by only one place.

### Recipe: add a page

1. Create `src/pages/<name>/ui/<Name>Page.tsx` and `src/pages/<name>/index.ts` exporting it.
2. Add a thin route file under the layout it belongs to. The folder only picks the layout; it does not appear in the URL.
   - `src/app/routes/_public/`: public pages, top navigation.
   - `src/app/routes/_guest/`: sign-in style pages in a centered card; signed-in users are sent to `/dashboard`.
   - `src/app/routes/_authenticated/`: signed-in pages with the sidebar; signed-out users go to `/login?redirect=…`.
3. The dev server regenerates `src/app/routeTree.gen.ts`; commit it.

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
- **Errors.** Failed mutations show a toast (`MutationCache` in `shared/api`) unless they set `meta: { errorToast: false }` to show the error in the form. Failed route loads render the route error component. A signed-in request that is still 401 after a token refresh means the session ended: the user sees "session expired" and lands on `/login?redirect=…`.
- **Zod + CSP.** Zod runs with `jitless: true` (`apps/web/src/app/setup-zod.ts`, imported first in `main.tsx`) so object schemas never probe `new Function` under the enforcing CSP; parsing is slightly slower, negligible at form/API payload sizes.
- **Forms.** TanStack Form with a Zod schema as the validator, fields rendered with `TextField` from `@/shared/ui` (`pages/register/ui/RegisterPage.tsx`). Server-side field errors (e.g. `email_taken`) are set with `formApi.setFieldMeta`.
- **i18n.** Messages live in `apps/web/messages/{en,vi}.json`; use `m.<key>()` from `@/shared/i18n`. Locale is stored in localStorage; `setLocale()` reloads the page.
- **Appearance.** The customizer drawer (`app/layout/AppearanceDrawer.tsx`, in every layout's header) sets color mode, palette, font family (Geist, Inter, system), font size, corner radius and language.
  - Choices are stored in Zustand (`shared/model/appearance.ts`, localStorage key `theme`) and applied as `.dark` plus `data-palette`, `data-font`, `data-font-size` and `data-radius` on `<html>`.
  - The CSS lives in `packages/ui/src/styles/globals.css`.
  - `public/theme-init.js` applies them before first paint and must mirror `readPersistedAppearance`/`applyAppearance`; `appearance.test.ts` checks that both produce the same `<html>`.
  - Add a setting by extending the allow-list in both files.
- **Tests: logic only.** Colocate tests as `*.test.ts` next to the code they cover, in the `node` environment. Add `// @vitest-environment happy-dom` only when a test needs browser APIs. API integration tests use MSW (`apps/web/test/server.ts`); unhandled requests fail. Coverage is reported without thresholds.
- **Commits.** Conventional Commits, checked by commitlint in the `commit-msg` hook. The pre-commit hook formats staged files and runs type-aware Oxlint per workspace.

## Environment variables

All `VITE_*` values are **public**: they are inlined into the JavaScript bundle. The schema in `apps/web/src/shared/config/env.schema.ts` is strict: an unknown `VITE_*` key, a malformed URL, or a non-https API URL in production fails the build.

| Variable          | Required | Notes                                                                                                                                                                                                                                     |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`    | yes      | API origin used by `@repo/api-client`. `.env.development` sets localhost; `.env.production` is only a placeholder that CI/Docker override.                                                                                                |
| `VITE_API_MOCK`   | no       | Development only: `true` answers API calls from the in-browser mock (`src/app/mocks`) instead of `VITE_API_URL`. Production builds never include the mock; CI checks `dist`.                                                              |
| `VITE_SENTRY_DSN` | no       | Enables Sentry. The SDK is loaded on demand only when this is set. The first pageload transaction, and errors thrown before the SDK loads, go only to the console. No user info, cookies, headers, bodies or query strings are collected. |

## Authentication

The contract is in `packages/api-client/api/openapi.yaml`, tags `auth` and `me`:

- `/auth/*`: login, register, refresh, logout, forgot-password, reset-password, verify-email, resend-verification.
- `/me`: profile, password and sessions.

Replace the spec with your backend's and run `bunx turbo run api:gen`. Error bodies carry a `code` (`invalid_credentials`, `email_taken`, `invalid_token`, `wrong_password`) that the pages map to messages.

### Session flow

- **Access token.** Kept in memory only (`shared/api/access-token.ts`), never in storage. Every request sends it as `Authorization: Bearer …`.
- **Refresh token.** An httpOnly cookie set by your API. `apiFetch` sends cookies (`credentials: "include"`).
- **Expired token.** When a request that carried a bearer token gets a 401, `apiFetch` calls `POST /auth/refresh` once (shared by concurrent requests) and retries the request once. A 401 without a bearer, such as a wrong password, is returned as is.
- **Reload.** After a reload (including the language switch) there is no token in memory, so the `['session']` query (`entities/session`) refreshes first, then loads `GET /me`. Route guards read the same query.
- **Sign out.** Calls `POST /auth/logout`, clears the token and the query cache, and goes to `/login`.

### What your backend must do

- **Refresh cookie.** Set it `HttpOnly; Secure`. If the API is on another site than the app, use `SameSite=None` and answer CORS with `Access-Control-Allow-Credentials: true` and an explicit origin. Some browsers (Safari) still block third-party cookies, so serving the API from the same site (or proxying `/api` through nginx) is the robust choice.
- **Refresh rotation.** Rotate refresh tokens with a short grace window: each tab refreshes on its own (there is no cross-tab token sync).
- **Sign out.** If the logout request fails on the network, the cookie survives and the next visit restores the session. Revoke server-side when that matters.
- **Email flows.**
  - Send verification and reset emails with links to `/verify-email?token=…` and `/reset-password?token=…`.
  - Make the tokens single-use with a TTL.
  - Treat a re-submitted, already-used verify token as success.
  - Answer forgot-password the same way whether or not the account exists.

### Dev mock API

With `VITE_API_MOCK=true` (the default in `.env.development`), an MSW service worker answers every API call in the browser. The same handlers (`apps/web/src/app/mocks`) back the integration tests.

- **Demo user.** `demo@example.com` / `password123`. The first sign-in also creates two fake "other device" sessions to revoke.
- **Emails.** Verify and reset emails are logged to the browser console as links.
- **Short tokens.** Access tokens last 30 seconds, so the refresh path runs during development.
- **Storage.** State lives in `localStorage["msw-auth"]`. Remove that key to start over.
- **Real backend.** Set `VITE_API_MOCK=false` (e.g. in `apps/web/.env.development.local`) and point `VITE_API_URL` at your backend.

Not included: avatar upload (wire `updateMe` to your storage; the UI shows initials), 2FA, OAuth, account deletion.

## Docker

```sh
docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com -t fsd-web .
docker run -p 8080:80 fsd-web
```

- **Build:** the image prunes the monorepo to `web` (`turbo prune --docker`), builds with Bun, and serves `dist` with nginx.
- **Build arg:** `VITE_API_URL` is required. It also becomes the only API origin allowed by the CSP `connect-src`.
- **nginx:** serves an SPA fallback, caches hashed `/assets/` forever, and sends `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and an **enforcing** Content-Security-Policy. HSTS belongs on your TLS terminator or CDN.

## Known chores

- **`shadcn add sidebar`:** re-apply the edits in `packages/ui`.
  - `sidebar.tsx`: the `mobileTitle`/`mobileDescription` props, which carry translated labels.
  - `hooks/use-mobile.ts`: `useSyncExternalStore` instead of setState in an effect.
- **`shadcn add sonner`:** after adding or updating sonner, re-apply the edit in `packages/ui/src/components/sonner.tsx`: no `next-themes`, `theme` passed as a prop, `toast` re-exported.
- **Renovate generator bumps:** PRs that bump `orval` or `@tanstack/router-plugin` may change generated code. Run `bunx turbo run api:gen` / `bun run build` and commit the result.
- **Paraglide strategy:** it is set in two places that must match, the Vite plugin in `apps/web/vite.config.ts` and the `i18n:compile` script in `apps/web/package.json`.

## License

[MIT](./LICENSE)
