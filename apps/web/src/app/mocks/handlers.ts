import { http, HttpResponse } from "msw/http"

import type { ErrorCode, Session, User } from "@repo/api-client"

import type { MockDb, MockSession, MockStore, MockUser } from "./store.ts"

export type MockEmail = { kind: "verify" | "reset"; to: string; link: string }

export type MockApiOptions = {
  baseUrl: string
  store: MockStore
  /** Short on purpose so the 401 → refresh → retry path runs during development. */
  accessTokenTtlMs?: number
  /** Where "sent" emails go; the browser worker logs the links to the console. */
  onEmail?: (email: MockEmail) => void
  now?: () => number
}

const EMAIL_TOKEN_TTL_MS = 60 * 60 * 1000
const MIN_PASSWORD = 8
const MAX_PASSWORD = 128
const OTHER_DEVICES = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) Mobile Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150.0 Safari/537.36",
]

const id = () => crypto.randomUUID()
const toUser = ({ password: _password, ...user }: MockUser): User => user
const normalizeEmail = (email: unknown) =>
  typeof email === "string" ? email.trim().toLowerCase() : ""
const validPassword = (password: unknown): password is string =>
  typeof password === "string" && password.length >= MIN_PASSWORD && password.length <= MAX_PASSWORD
const validName = (name: unknown): name is string =>
  typeof name === "string" && name.trim().length > 0 && name.length <= 100

const error = (status: number, message: string, code?: ErrorCode) =>
  HttpResponse.json({ message, ...(code && { code }) }, { status })
const unauthorized = () => error(401, "Unauthorized")
const invalidInput = () => error(400, "Invalid input")
const noContent = (status: 202 | 204 = 204) => new HttpResponse(null, { status })

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json()
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function createMockHandlers({
  baseUrl,
  store,
  accessTokenTtlMs = 30_000,
  onEmail = ({ kind, to, link }) => console.info(`[mock api] ${kind} email to ${to}: ${link}`),
  now = Date.now,
}: MockApiOptions) {
  const api = (path: string) => `${baseUrl.replace(/\/+$/, "")}${path}`
  const appLink = (path: string) => `${globalThis.location?.origin ?? ""}${path}`
  const isoNow = () => new Date(now()).toISOString()

  function issueAccessToken(db: MockDb, sessionId: string): string {
    for (const [expired, { expiresAt }] of Object.entries(db.accessTokens)) {
      if (expiresAt <= now()) delete db.accessTokens[expired]
    }
    const token = id()
    db.accessTokens[token] = { sessionId, expiresAt: now() + accessTokenTtlMs }
    return token
  }

  function startSession(db: MockDb, user: MockUser, userAgent: string) {
    const session: MockSession = {
      id: id(),
      userId: user.id,
      refreshToken: id(),
      createdAt: isoNow(),
      lastSeenAt: isoNow(),
      userAgent,
    }
    db.sessions.push(session)
    db.refreshCookie = session.refreshToken
    return { accessToken: issueAccessToken(db, session.id), user: toUser(user) }
  }

  /** One browser can't show "other devices", so sign-in adds two fake ones to revoke. */
  function seedOtherDevices(db: MockDb, user: MockUser) {
    if (db.sessions.some((session) => session.userId === user.id)) return
    for (const userAgent of OTHER_DEVICES) {
      db.sessions.push({
        id: id(),
        userId: user.id,
        refreshToken: id(),
        createdAt: isoNow(),
        lastSeenAt: isoNow(),
        userAgent,
      })
    }
  }

  function sendEmail(db: MockDb, user: MockUser, kind: MockEmail["kind"]) {
    const token = id()
    db.emailTokens[token] = {
      userId: user.id,
      kind,
      expiresAt: now() + EMAIL_TOKEN_TTL_MS,
      used: false,
    }
    const path = kind === "verify" ? "/verify-email" : "/reset-password"
    onEmail({ kind, to: user.email, link: appLink(`${path}?token=${token}`) })
  }

  function revokeSessions(db: MockDb, keep: (session: MockSession) => boolean) {
    db.sessions = db.sessions.filter(keep)
    const live = new Set(db.sessions.map((session) => session.id))
    for (const [token, { sessionId }] of Object.entries(db.accessTokens)) {
      if (!live.has(sessionId)) delete db.accessTokens[token]
    }
    if (!db.sessions.some((session) => session.refreshToken === db.refreshCookie)) {
      delete db.refreshCookie
    }
  }

  /** Resolves the bearer token to its live session and user, or undefined. */
  function authenticate(db: MockDb, request: Request) {
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "")
    const access = token ? db.accessTokens[token] : undefined
    if (!access || access.expiresAt <= now()) return undefined
    const session = db.sessions.find((candidate) => candidate.id === access.sessionId)
    const user = session && db.users.find((candidate) => candidate.id === session.userId)
    return session && user ? { session, user } : undefined
  }

  // Service workers usually don't see the user-agent header; fall back to this browser's.
  const userAgentOf = (request: Request) =>
    request.headers.get("user-agent") ?? globalThis.navigator?.userAgent ?? "Unknown device"

  return [
    http.post(api("/auth/login"), async ({ request }) => {
      const body = await readJson(request)
      return store.update((db) => {
        const user = db.users.find((candidate) => candidate.email === normalizeEmail(body.email))
        if (!user || user.password !== body.password) {
          return error(401, "Invalid email or password", "invalid_credentials")
        }
        seedOtherDevices(db, user)
        return HttpResponse.json(startSession(db, user, userAgentOf(request)))
      })
    }),

    http.post(api("/auth/register"), async ({ request }) => {
      const body = await readJson(request)
      const email = normalizeEmail(body.email)
      if (!validName(body.name) || !email.includes("@") || !validPassword(body.password)) {
        return invalidInput()
      }
      const { name, password } = body
      return store.update((db) => {
        if (db.users.some((candidate) => candidate.email === email)) {
          return error(409, "Email already registered", "email_taken")
        }
        const user: MockUser = {
          id: id(),
          name: name.trim(),
          email,
          emailVerified: false,
          createdAt: isoNow(),
          password,
        }
        db.users.push(user)
        sendEmail(db, user, "verify")
        return HttpResponse.json(startSession(db, user, userAgentOf(request)), { status: 201 })
      })
    }),

    http.post(api("/auth/refresh"), () =>
      store.update((db) => {
        const session = db.sessions.find((candidate) => candidate.refreshToken === db.refreshCookie)
        if (!session) return unauthorized()
        // Rotate the refresh token, like a real backend should.
        session.refreshToken = id()
        session.lastSeenAt = isoNow()
        db.refreshCookie = session.refreshToken
        return HttpResponse.json({ accessToken: issueAccessToken(db, session.id) })
      }),
    ),

    http.post(api("/auth/logout"), () =>
      store.update((db) => {
        const cookie = db.refreshCookie
        revokeSessions(db, (session) => session.refreshToken !== cookie)
        delete db.refreshCookie
        return noContent()
      }),
    ),

    http.post(api("/auth/forgot-password"), async ({ request }) => {
      const email = normalizeEmail((await readJson(request)).email)
      store.update((db) => {
        const user = db.users.find((candidate) => candidate.email === email)
        if (user) sendEmail(db, user, "reset")
      })
      // Same answer whether or not the account exists.
      return noContent(202)
    }),

    http.post(api("/auth/reset-password"), async ({ request }) => {
      const body = await readJson(request)
      if (!validPassword(body.password)) return invalidInput()
      const { password } = body
      return store.update((db) => {
        const entry = typeof body.token === "string" ? db.emailTokens[body.token] : undefined
        const user = entry && db.users.find((candidate) => candidate.id === entry.userId)
        if (!entry || !user || entry.kind !== "reset" || entry.used || entry.expiresAt <= now()) {
          return error(400, "Invalid or expired link", "invalid_token")
        }
        entry.used = true
        user.password = password
        // A password reset signs the account out everywhere.
        revokeSessions(db, (session) => session.userId !== user.id)
        return noContent()
      })
    }),

    http.post(api("/auth/verify-email"), async ({ request }) => {
      const body = await readJson(request)
      return store.update((db) => {
        const entry = typeof body.token === "string" ? db.emailTokens[body.token] : undefined
        const user = entry && db.users.find((candidate) => candidate.id === entry.userId)
        // Re-submitting a used verify link succeeds (idempotent).
        if (
          !entry ||
          !user ||
          entry.kind !== "verify" ||
          (!entry.used && entry.expiresAt <= now())
        ) {
          return error(400, "Invalid or expired link", "invalid_token")
        }
        entry.used = true
        user.emailVerified = true
        return noContent()
      })
    }),

    http.post(api("/auth/resend-verification"), ({ request }) =>
      store.update((db) => {
        const auth = authenticate(db, request)
        if (!auth) return unauthorized()
        if (!auth.user.emailVerified) sendEmail(db, auth.user, "verify")
        return noContent(202)
      }),
    ),

    http.get(api("/me"), ({ request }) =>
      store.update((db) => {
        const auth = authenticate(db, request)
        return auth ? HttpResponse.json(toUser(auth.user)) : unauthorized()
      }),
    ),

    http.patch(api("/me"), async ({ request }) => {
      const body = await readJson(request)
      if (!validName(body.name)) return invalidInput()
      const { name } = body
      return store.update((db) => {
        const auth = authenticate(db, request)
        if (!auth) return unauthorized()
        auth.user.name = name.trim()
        return HttpResponse.json(toUser(auth.user))
      })
    }),

    http.post(api("/me/password"), async ({ request }) => {
      const body = await readJson(request)
      if (!validPassword(body.newPassword)) return invalidInput()
      const { newPassword } = body
      return store.update((db) => {
        const auth = authenticate(db, request)
        if (!auth) return unauthorized()
        if (auth.user.password !== body.currentPassword) {
          return error(400, "Current password is incorrect", "wrong_password")
        }
        auth.user.password = newPassword
        return noContent()
      })
    }),

    http.get(api("/me/sessions"), ({ request }) =>
      store.update((db) => {
        const auth = authenticate(db, request)
        if (!auth) return unauthorized()
        const sessions: Session[] = db.sessions
          .filter((session) => session.userId === auth.user.id)
          .map(({ id: sessionId, createdAt, lastSeenAt, userAgent }) => ({
            id: sessionId,
            createdAt,
            lastSeenAt,
            userAgent,
            current: sessionId === auth.session.id,
          }))
        return HttpResponse.json(sessions)
      }),
    ),

    http.post(api("/me/sessions/revoke-others"), ({ request }) =>
      store.update((db) => {
        const auth = authenticate(db, request)
        if (!auth) return unauthorized()
        revokeSessions(
          db,
          (session) => session.userId !== auth.user.id || session.id === auth.session.id,
        )
        return noContent()
      }),
    ),

    http.delete(api("/me/sessions/:id"), ({ request, params }) =>
      store.update((db) => {
        const auth = authenticate(db, request)
        if (!auth) return unauthorized()
        const target = db.sessions.find(
          (session) => session.id === params.id && session.userId === auth.user.id,
        )
        if (!target) return error(404, "Session not found")
        revokeSessions(db, (session) => session !== target)
        return noContent()
      }),
    ),
  ]
}
