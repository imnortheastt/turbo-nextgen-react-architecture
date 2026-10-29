import { useEffect, useSyncExternalStore } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export const THEME_STORAGE_KEY = "theme"
export const MODES = ["light", "dark", "system"] as const
export const PALETTES = ["neutral", "blue", "green", "rose"] as const

export type Mode = (typeof MODES)[number]
export type Palette = (typeof PALETTES)[number]
export type ThemePreference = { mode: Mode; palette: Palette }

export const DEFAULT_THEME: ThemePreference = { mode: "system", palette: "neutral" }

const isMode = (value: unknown): value is Mode => MODES.includes(value as Mode)
const isPalette = (value: unknown): value is Palette => PALETTES.includes(value as Palette)

/** Keeps only known values; anything else in storage falls back to defaults. */
function sanitizeTheme(value: unknown): ThemePreference {
  const state = (value ?? {}) as Partial<Record<keyof ThemePreference, unknown>>
  return {
    mode: isMode(state.mode) ? state.mode : DEFAULT_THEME.mode,
    palette: isPalette(state.palette) ? state.palette : DEFAULT_THEME.palette,
  }
}

/**
 * Reads the raw persisted store payload (`{ state: {...}, version }`).
 * public/theme-init.js mirrors this logic to apply the theme before first paint.
 */
export function readPersistedTheme(raw: string | null): ThemePreference {
  try {
    return sanitizeTheme((JSON.parse(raw ?? "null") as { state?: unknown } | null)?.state)
  } catch {
    return DEFAULT_THEME
  }
}

function resolveMode(mode: Mode, prefersDark: boolean): "light" | "dark" {
  if (mode === "system") return prefersDark ? "dark" : "light"
  return mode
}

function applyTheme(root: HTMLElement, theme: ThemePreference, prefersDark: boolean): void {
  const resolved = resolveMode(theme.mode, prefersDark)
  root.classList.toggle("dark", resolved === "dark")
  root.dataset.palette = theme.palette
  root.style.colorScheme = resolved
}

type ThemeState = ThemePreference & {
  setMode: (mode: Mode) => void
  setPalette: (palette: Palette) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      ...DEFAULT_THEME,
      setMode: (mode) => set({ mode }),
      setPalette: (palette) => set({ palette }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ mode, palette }) => ({ mode, palette }),
      merge: (persisted, current) => ({ ...current, ...sanitizeTheme(persisted) }),
    },
  ),
)

const DARK_QUERY = "(prefers-color-scheme: dark)"

function subscribeToColorScheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function usePrefersDark(): boolean {
  return useSyncExternalStore(subscribeToColorScheme, () => window.matchMedia(DARK_QUERY).matches)
}

/** The mode actually shown, with `system` resolved against the OS setting. */
export function useResolvedMode(): "light" | "dark" {
  const mode = useThemeStore((state) => state.mode)
  return resolveMode(mode, usePrefersDark())
}

/** Keeps `<html>` in sync with the theme store and the OS color scheme. */
export function useApplyTheme(): void {
  const mode = useThemeStore((state) => state.mode)
  const palette = useThemeStore((state) => state.palette)
  const prefersDark = usePrefersDark()

  useEffect(() => {
    applyTheme(document.documentElement, { mode, palette }, prefersDark)
  }, [mode, palette, prefersDark])
}
