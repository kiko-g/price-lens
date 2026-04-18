import { getRequestConfig } from "next-intl/server"
import { resolveLocale } from "./locale"

export default getRequestConfig(async () => {
  const locale = await resolveLocale()
  const messages = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    messages,
    timeZone: "Europe/Lisbon",
    now: new Date(),
    formats: {
      dateTime: {
        short: { day: "2-digit", month: "2-digit", year: "numeric" },
        medium: { day: "2-digit", month: "short", year: "numeric" },
        long: { day: "2-digit", month: "long", year: "numeric" },
        dateTime: {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      },
      number: {
        currency: { style: "currency", currency: "EUR" },
        percent: { style: "percent", maximumFractionDigits: 1 },
      },
    },
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter((v) => v != null).join(".")
      console.warn(`[i18n] Missing translation for key "${path}" (locale: ${locale})`)
      return path
    },
  }
})
