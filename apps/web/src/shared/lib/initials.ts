const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" })

const firstGrapheme = (word: string) =>
  graphemes.segment(word)[Symbol.iterator]().next().value?.segment ?? ""

/** Up to two initials from a display name (first and last word), for avatar fallbacks. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const picked = words.length > 1 ? [words[0] ?? "", words.at(-1) ?? ""] : words
  return picked.map((word) => firstGrapheme(word).toUpperCase()).join("") || "?"
}
