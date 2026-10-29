// Applies the persisted theme before first paint so the page never flashes the
// wrong colors. Mirrors readPersistedTheme/applyTheme in
// src/shared/model/theme.ts; src/shared/model/theme.test.ts runs this file.
;(() => {
  const MODES = ["light", "dark", "system"]
  const PALETTES = ["neutral", "blue", "green", "rose"]
  let mode = "system"
  let palette = "neutral"
  try {
    const state = JSON.parse(localStorage.getItem("theme") ?? "null")?.state
    if (MODES.includes(state?.mode)) mode = state.mode
    if (PALETTES.includes(state?.palette)) palette = state.palette
  } catch {
    // Unreadable storage: keep defaults.
  }
  const dark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.dataset.palette = palette
  root.style.colorScheme = dark ? "dark" : "light"
})()
