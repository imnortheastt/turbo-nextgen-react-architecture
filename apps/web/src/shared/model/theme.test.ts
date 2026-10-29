// @vitest-environment happy-dom
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { runInThisContext } from "node:vm"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_THEME, THEME_STORAGE_KEY, readPersistedTheme, useThemeStore } from "./theme.ts"

// The no-flash script that index.html runs before React mounts.
const themeInitScript = readFileSync(
  join(import.meta.dirname, "../../../public/theme-init.js"),
  "utf8",
)
const runThemeInitScript = () => runInThisContext(themeInitScript)

function stubPrefersDark(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches, media: query }))
}

const root = () => document.documentElement

beforeEach(() => {
  useThemeStore.setState(DEFAULT_THEME)
  // setState persists; start each test from empty storage.
  localStorage.clear()
  root().className = ""
  delete root().dataset.palette
  stubPrefersDark(false)
})

describe("theme persistence", () => {
  it("lets the init script apply the theme the store persisted", () => {
    useThemeStore.getState().setMode("dark")
    useThemeStore.getState().setPalette("blue")

    runThemeInitScript()

    expect(root().classList.contains("dark")).toBe(true)
    expect(root().dataset.palette).toBe("blue")
    expect(readPersistedTheme(localStorage.getItem(THEME_STORAGE_KEY))).toEqual({
      mode: "dark",
      palette: "blue",
    })
  })

  it("resolves system mode from the OS color scheme", () => {
    stubPrefersDark(true)
    useThemeStore.getState().setMode("system")

    runThemeInitScript()

    expect(root().classList.contains("dark")).toBe(true)
  })

  it.each(["{not json", JSON.stringify({ state: { mode: "neon", palette: 7 } })])(
    "falls back to defaults for unusable storage %s",
    (raw) => {
      localStorage.setItem(THEME_STORAGE_KEY, raw)

      runThemeInitScript()

      expect(root().classList.contains("dark")).toBe(false)
      expect(root().dataset.palette).toBe(DEFAULT_THEME.palette)
      expect(readPersistedTheme(raw)).toEqual(DEFAULT_THEME)
    },
  )
})
