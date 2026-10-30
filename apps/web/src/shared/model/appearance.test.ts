// @vitest-environment happy-dom
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { runInThisContext } from "node:vm"

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  APPEARANCE_STORAGE_KEY,
  applyAppearance,
  DEFAULT_APPEARANCE,
  readPersistedAppearance,
  useAppearanceStore,
  type Appearance,
} from "./appearance.ts"

// The no-flash script that index.html runs before React mounts.
const initScript = readFileSync(join(import.meta.dirname, "../../../public/theme-init.js"), "utf8")
const runInitScript = () => runInThisContext(initScript)

function stubPrefersDark(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches, media: query }))
}

const root = () => document.documentElement

function resetRoot() {
  root().className = ""
  root().removeAttribute("style")
  for (const key of Object.keys(root().dataset)) delete root().dataset[key]
}

/** What <html> ends up with: classes, data-* attributes and color-scheme. */
const snapshot = () => ({
  className: root().className,
  dataset: Object.fromEntries(Object.entries(root().dataset)),
  colorScheme: root().style.colorScheme,
})

const persist = (state: unknown) =>
  localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ state, version: 0 }))

beforeEach(() => {
  useAppearanceStore.setState(DEFAULT_APPEARANCE)
  // setState persists; start each test from empty storage.
  localStorage.clear()
  resetRoot()
  stubPrefersDark(false)
})

describe("appearance persistence", () => {
  it("lets the init script apply every field the store persisted", () => {
    useAppearanceStore.getState().set({
      mode: "dark",
      palette: "rose",
      fontSize: "lg",
      fontFamily: "inter",
      radius: "none",
    })

    runInitScript()

    expect(snapshot()).toEqual({
      className: "dark",
      dataset: { palette: "rose", fontSize: "lg", font: "inter", radius: "none" },
      colorScheme: "dark",
    })
  })

  it("keeps a theme saved before the font, size and radius fields existed", () => {
    persist({ mode: "dark", palette: "blue" })

    expect(readPersistedAppearance(localStorage.getItem(APPEARANCE_STORAGE_KEY))).toEqual({
      ...DEFAULT_APPEARANCE,
      mode: "dark",
      palette: "blue",
    })
  })

  it("reset restores the defaults", () => {
    useAppearanceStore.getState().set({ palette: "green", radius: "lg" })
    useAppearanceStore.getState().reset()

    expect(readPersistedAppearance(localStorage.getItem(APPEARANCE_STORAGE_KEY))).toEqual(
      DEFAULT_APPEARANCE,
    )
  })

  it.each([
    "{not json",
    JSON.stringify({
      state: { mode: "neon", palette: 7, fontSize: "xxl", fontFamily: "comic", radius: -1 },
    }),
  ])("falls back to defaults for unusable storage %s", (raw) => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, raw)

    runInitScript()

    expect(readPersistedAppearance(raw)).toEqual(DEFAULT_APPEARANCE)
    expect(snapshot().dataset).toEqual({
      palette: "neutral",
      fontSize: "md",
      font: "geist",
      radius: "md",
    })
  })
})

describe("theme-init.js mirrors applyAppearance", () => {
  const cases: [string, Partial<Appearance>, boolean][] = [
    ["defaults, light OS", {}, false],
    ["system mode, dark OS", { mode: "system" }, true],
    ["light mode on a dark OS", { mode: "light", palette: "blue", fontSize: "sm" }, true],
    [
      "everything changed",
      { mode: "dark", palette: "green", fontSize: "lg", fontFamily: "system", radius: "sm" },
      false,
    ],
    ["partly invalid", { mode: "dark", radius: "huge" as Appearance["radius"] }, false],
  ]

  it.each(cases)("%s", (_label, state, prefersDark) => {
    stubPrefersDark(prefersDark)
    persist(state)

    runInitScript()
    const fromScript = snapshot()

    resetRoot()
    applyAppearance(
      root(),
      readPersistedAppearance(localStorage.getItem(APPEARANCE_STORAGE_KEY)),
      prefersDark,
    )

    expect(snapshot()).toEqual(fromScript)
  })
})
