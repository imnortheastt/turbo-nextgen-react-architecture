import { LocaleSelect } from "./LocaleSelect.tsx"
import { ThemeControls } from "./ThemeControls.tsx"

/** Appearance and language controls shared by every layout's header. */
export function HeaderControls() {
  return (
    <div className="flex items-center gap-2">
      <LocaleSelect />
      <ThemeControls />
    </div>
  )
}
