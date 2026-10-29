// Same-origin absolute path: "/x", but not "//host" or "/\host" (protocol-relative).
const SAME_ORIGIN_PATH = /^\/(?![\\/])/

// Browsers strip tab/newline from URLs, which can turn "/\t/host" into "//host".
function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

/** Returns `value` only when it is a same-origin path, otherwise `fallback`. */
export function safeRedirect(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback
  if (hasControlChars(value) || !SAME_ORIGIN_PATH.test(value)) return fallback
  return value
}
