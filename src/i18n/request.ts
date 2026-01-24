import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { locales, defaultLocale } from "./config"

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !hasLocale(locales, locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
