import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { m } from "@/shared/i18n"
import {
  MODES,
  PALETTES,
  useResolvedMode,
  useThemeStore,
  type Mode,
  type Palette,
} from "@/shared/model"
import { Button } from "@repo/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { toast } from "@repo/ui/components/sonner"

const MODE_LABELS: Record<Mode, () => string> = {
  light: m.theme_light,
  dark: m.theme_dark,
  system: m.theme_system,
}

const PALETTE_LABELS: Record<Palette, () => string> = {
  neutral: m.palette_neutral,
  blue: m.palette_blue,
  green: m.palette_green,
  rose: m.palette_rose,
}

const isMode = (value: unknown): value is Mode => MODES.includes(value as Mode)
const isPalette = (value: unknown): value is Palette => PALETTES.includes(value as Palette)

export function ThemeControls() {
  const mode = useThemeStore((state) => state.mode)
  const palette = useThemeStore((state) => state.palette)
  const setMode = useThemeStore((state) => state.setMode)
  const setPalette = useThemeStore((state) => state.setPalette)
  const resolvedMode = useResolvedMode()
  const ModeIcon = mode === "system" ? MonitorIcon : resolvedMode === "dark" ? MoonIcon : SunIcon

  const paletteItems = PALETTES.map((value) => ({ value, label: PALETTE_LABELS[value]() }))

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label={m.theme_mode()} />}
        >
          <ModeIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={mode}
            onValueChange={(value) => {
              if (isMode(value)) setMode(value)
            }}
          >
            {MODES.map((value) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {MODE_LABELS[value]()}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Select
        items={paletteItems}
        value={palette}
        onValueChange={(value) => {
          if (!isPalette(value) || value === palette) return
          setPalette(value)
          toast.success(m.palette_changed())
        }}
      >
        <SelectTrigger size="sm" aria-label={m.theme_palette()}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {paletteItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
