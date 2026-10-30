import { SlidersHorizontalIcon, XIcon } from "lucide-react"

import { m } from "@/shared/i18n"
import {
  FONT_FAMILIES,
  FONT_SIZES,
  MODES,
  PALETTES,
  RADII,
  useAppearanceStore,
  type Appearance,
} from "@/shared/model"
import { Button } from "@repo/ui/components/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet"

import { LocaleSelect } from "./LocaleSelect.tsx"

type Labels<Key extends keyof Appearance> = Record<Appearance[Key], () => string>

const MODE_LABELS: Labels<"mode"> = {
  light: m.theme_light,
  dark: m.theme_dark,
  system: m.theme_system,
}
const PALETTE_LABELS: Labels<"palette"> = {
  neutral: m.palette_neutral,
  blue: m.palette_blue,
  green: m.palette_green,
  rose: m.palette_rose,
}
const PALETTE_SWATCHES: Record<Appearance["palette"], string> = {
  neutral: "bg-neutral-800",
  blue: "bg-blue-600",
  green: "bg-green-600",
  rose: "bg-rose-600",
}
const FONT_SIZE_LABELS: Labels<"fontSize"> = {
  sm: m.size_small,
  md: m.size_default,
  lg: m.size_large,
}
const FONT_LABELS: Labels<"fontFamily"> = {
  geist: () => "Geist",
  inter: () => "Inter",
  system: m.font_system,
}
const RADIUS_LABELS: Labels<"radius"> = {
  none: m.radius_none,
  sm: m.size_small,
  md: m.size_default,
  lg: m.size_large,
}

type OptionGroupProps<Key extends keyof Appearance> = {
  name: Key
  legend: string
  options: readonly Appearance[Key][]
  labels: Labels<Key>
  swatches?: Record<Appearance[Key], string>
}

/** One appearance setting as a row of toggle buttons; changes apply immediately. */
function OptionGroup<Key extends keyof Appearance>({
  name,
  legend,
  options,
  labels,
  swatches,
}: OptionGroupProps<Key>) {
  const value = useAppearanceStore((state) => state[name])
  const set = useAppearanceStore((state) => state.set)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={value === option}
            className="justify-start aria-pressed:border-primary aria-pressed:ring-1 aria-pressed:ring-primary"
            onClick={() => set({ [name]: option } as Partial<Appearance>)}
          >
            {swatches && (
              <span
                aria-hidden
                className={`size-3 rounded-full ring-1 ring-border ${swatches[option]}`}
              />
            )}
            {labels[option]()}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}

/** Drawer with every appearance setting plus the language; opened from each layout's header. */
export function AppearanceDrawer() {
  const reset = useAppearanceStore((state) => state.reset)

  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" aria-label={m.appearance_open()} />}
      >
        <SlidersHorizontalIcon />
      </SheetTrigger>
      {/* Own close button: the generated one has an untranslated label. */}
      <SheetContent side="right" showCloseButton={false} className="overflow-y-auto">
        <SheetHeader className="flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <SheetTitle>{m.appearance_title()}</SheetTitle>
            <SheetDescription>{m.appearance_description()}</SheetDescription>
          </div>
          <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label={m.close()} />}>
            <XIcon />
          </SheetClose>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4">
          <OptionGroup name="mode" legend={m.theme_mode()} options={MODES} labels={MODE_LABELS} />
          <OptionGroup
            name="palette"
            legend={m.theme_palette()}
            options={PALETTES}
            labels={PALETTE_LABELS}
            swatches={PALETTE_SWATCHES}
          />
          <OptionGroup
            name="fontFamily"
            legend={m.appearance_font()}
            options={FONT_FAMILIES}
            labels={FONT_LABELS}
          />
          <OptionGroup
            name="fontSize"
            legend={m.appearance_font_size()}
            options={FONT_SIZES}
            labels={FONT_SIZE_LABELS}
          />
          <OptionGroup
            name="radius"
            legend={m.appearance_radius()}
            options={RADII}
            labels={RADIUS_LABELS}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{m.locale_label()}</span>
            <LocaleSelect />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={reset}>
            {m.appearance_reset()}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
