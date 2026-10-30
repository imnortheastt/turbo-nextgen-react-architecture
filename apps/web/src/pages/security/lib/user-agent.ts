const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\//, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
]

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad/, "iOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
]

const find = (list: [RegExp, string][], userAgent: string) =>
  list.find(([pattern]) => pattern.test(userAgent))?.[1]

/** A coarse "Browser on OS" label for the sessions list; undefined parts when unknown. */
export function describeUserAgent(userAgent: string): { browser?: string; os?: string } {
  return { browser: find(BROWSERS, userAgent), os: find(SYSTEMS, userAgent) }
}
