// Applies the saved appearance before first paint so the page never flashes the
// wrong colors, font or sizes. Mirrors readPersistedAppearance/applyAppearance in
// src/shared/model/appearance.ts; src/shared/model/appearance.test.ts checks
// that both produce the same <html> attributes.
;(() => {
  const ALLOWED = {
    mode: ["light", "dark", "system"],
    palette: ["neutral", "blue", "green", "rose"],
    fontSize: ["sm", "md", "lg"],
    fontFamily: ["geist", "inter", "system"],
    radius: ["none", "sm", "md", "lg"],
  }
  const appearance = {
    mode: "system",
    palette: "neutral",
    fontSize: "md",
    fontFamily: "geist",
    radius: "md",
  }
  try {
    const state = JSON.parse(localStorage.getItem("theme") ?? "null")?.state
    for (const key of Object.keys(ALLOWED)) {
      if (ALLOWED[key].includes(state?.[key])) appearance[key] = state[key]
    }
  } catch {
    // Unreadable storage: keep defaults.
  }
  const dark =
    appearance.mode === "dark" ||
    (appearance.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.dataset.palette = appearance.palette
  root.dataset.fontSize = appearance.fontSize
  root.dataset.font = appearance.fontFamily
  root.dataset.radius = appearance.radius
  root.style.colorScheme = dark ? "dark" : "light"
})()
