import { getLocale, locales, m, setLocale, type Locale } from "@/shared/i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
}

const isLocale = (value: unknown): value is Locale => locales.includes(value as Locale)

export function LocaleSelect() {
  const items = locales.map((value) => ({ value, label: LOCALE_NAMES[value] }))

  return (
    <Select
      items={items}
      value={getLocale()}
      // setLocale persists the choice (localStorage) and reloads the page.
      onValueChange={(value) => {
        if (isLocale(value)) void setLocale(value)
      }}
    >
      <SelectTrigger size="sm" aria-label={m.locale_label()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
