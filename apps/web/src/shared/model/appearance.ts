import { useEffect, useSyncExternalStore } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

/** Storage key kept from the earlier theme-only store, so saved choices carry over. */
export const APPEARANCE_STORAGE_KEY = "theme"

export const MODES = ["light", "dark", "system"] as const
export const PALETTES = ["neutral", "blue", "green", "rose"] as const
export const FONT_SIZES = ["sm", "md", "lg"] as const
export const FONT_FAMILIES = ["geist", "inter", "system"] as const
export const RADII = ["none", "sm", "md", "lg"] as const

type Mode = (typeof MODES)[number]
type Palette = (typeof PALETTES)[number]
type FontSize = (typeof FONT_SIZES)[number]
type FontFamily = (typeof FONT_FAMILIES)[number]
type Radius = (typeof RADII)[number]

export type Appearance = {
  mode: Mode
  palette: Palette
  fontSize: FontSize
  fontFamily: FontFamily
  radius: Radius
}

export const DEFAULT_APPEARANCE: Appearance = {
  mode: "system",
  palette: "neutral",
  fontSize: "md",
  fontFamily: "geist",
  radius: "md",
}

const ALLOWED: { [Key in keyof Appearance]: readonly Appearance[Key][] } = {
  mode: MODES,
  palette: PALETTES,
  fontSize: FONT_SIZES,
  fontFamily: FONT_FAMILIES,
  radius: RADII,
}

const pick = <Key extends keyof Appearance>(key: Key, value: unknown): Appearance[Key] =>
  ALLOWED[key].includes(value as Appearance[Key])
    ? (value as Appearance[Key])
    : DEFAULT_APPEARANCE[key]

/**
 * Keeps only known values; anything else, including fields missing from older
 * saved state, falls back to its default.
 */
function sanitizeAppearance(value: unknown): Appearance {
  const state = (value ?? {}) as Partial<Record<keyof Appearance, unknown>>
  return {
    mode: pick("mode", state.mode),
    palette: pick("palette", state.palette),
    fontSize: pick("fontSize", state.fontSize),
    fontFamily: pick("fontFamily", state.fontFamily),
    radius: pick("radius", state.radius),
  }
}

/**
 * Reads the raw persisted store payload (`{ state: {...}, version }`).
 * public/theme-init.js mirrors this and applyAppearance to apply it before first paint.
 */
export function readPersistedAppearance(raw: string | null): Appearance {
  try {
    return sanitizeAppearance((JSON.parse(raw ?? "null") as { state?: unknown } | null)?.state)
  } catch {
    return DEFAULT_APPEARANCE
  }
}

function resolveMode(mode: Mode, prefersDark: boolean): "light" | "dark" {
  if (mode === "system") return prefersDark ? "dark" : "light"
  return mode
}

export function applyAppearance(
  root: HTMLElement,
  appearance: Appearance,
  prefersDark: boolean,
): void {
  const resolved = resolveMode(appearance.mode, prefersDark)
  root.classList.toggle("dark", resolved === "dark")
  root.dataset.palette = appearance.palette
  root.dataset.fontSize = appearance.fontSize
  root.dataset.font = appearance.fontFamily
  root.dataset.radius = appearance.radius
  root.style.colorScheme = resolved
}

type AppearanceState = Appearance & {
  set: (change: Partial<Appearance>) => void
  reset: () => void
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      ...DEFAULT_APPEARANCE,
      set: (change) => set(change),
      reset: () => set(DEFAULT_APPEARANCE),
    }),
    {
      name: APPEARANCE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ mode, palette, fontSize, fontFamily, radius }) => ({
        mode,
        palette,
        fontSize,
        fontFamily,
        radius,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeAppearance(persisted) }),
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
  const mode = useAppearanceStore((state) => state.mode)
  return resolveMode(mode, usePrefersDark())
}

/** Keeps `<html>` in sync with the appearance store and the OS color scheme. */
export function useApplyAppearance(): void {
  const mode = useAppearanceStore((state) => state.mode)
  const palette = useAppearanceStore((state) => state.palette)
  const fontSize = useAppearanceStore((state) => state.fontSize)
  const fontFamily = useAppearanceStore((state) => state.fontFamily)
  const radius = useAppearanceStore((state) => state.radius)
  const prefersDark = usePrefersDark()

  useEffect(() => {
    applyAppearance(
      document.documentElement,
      { mode, palette, fontSize, fontFamily, radius },
      prefersDark,
    )
  }, [mode, palette, fontSize, fontFamily, radius, prefersDark])
}
