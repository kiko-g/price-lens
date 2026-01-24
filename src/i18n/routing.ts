import { defineRouting } from "next-intl/routing"
import { locales, defaultLocale } from "./config"

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // Only show /en/ prefix, Portuguese is default without prefix
})
