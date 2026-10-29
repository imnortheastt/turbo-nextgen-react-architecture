import type { User } from "@repo/api-client"

/**
 * In-memory database behind the dev/test mock API. Mock only: passwords are
 * stored in plain text and the "refresh cookie" is a field here, because a
 * service worker cannot set real httpOnly cookies.
 */
export type MockUser = User & { password: string }

export type MockSession = {
  id: string
  userId: string
  refreshToken: string
  createdAt: string
  lastSeenAt: string
  userAgent: string
}

type EmailToken = { userId: string; kind: "verify" | "reset"; expiresAt: number; used: boolean }

export type MockDb = {
  users: MockUser[]
  sessions: MockSession[]
  accessTokens: Record<string, { sessionId: string; expiresAt: number }>
  emailTokens: Record<string, EmailToken>
  /** The browser's refresh cookie: the refresh token of the session it belongs to. */
  refreshCookie?: string
}

export const DEMO_USER = { email: "demo@example.com", password: "password123" } as const

function seed(): MockDb {
  return {
    users: [
      {
        id: "user-demo",
        name: "Demo User",
        email: DEMO_USER.email,
        emailVerified: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        password: DEMO_USER.password,
      },
    ],
    sessions: [],
    accessTokens: {},
    emailTokens: {},
  }
}

export type MockStore = {
  read: () => MockDb
  /** Applies `change` to the current state and persists the result. */
  update: <T>(change: (db: MockDb) => T) => T
  reset: () => void
}

/** Persists to `storage` (localStorage in the browser, so it survives reloads) or keeps state in memory. */
export function createMockStore(storage?: Storage, key = "msw-auth"): MockStore {
  let memory: MockDb | undefined

  const read = (): MockDb => {
    if (!storage) return (memory ??= seed())
    try {
      const raw = storage.getItem(key)
      if (raw) return JSON.parse(raw) as MockDb
    } catch {
      // Corrupt state: start over.
    }
    return seed()
  }

  const write = (db: MockDb) => {
    if (storage) storage.setItem(key, JSON.stringify(db))
    else memory = db
  }

  return {
    read,
    update: (change) => {
      const db = read()
      const result = change(db)
      write(db)
      return result
    },
    reset: () => write(seed()),
  }
}
