import "server-only"
import { cookies, headers } from "next/headers"
import { enUS, pt as ptLocale } from "date-fns/locale"
import type { Locale as DateFnsLocale } from "date-fns"

import { createClient } from "@/lib/supabase/server"
import { LOCALE_COOKIE, defaultLocale, isLocale, parseAcceptLanguage, type Locale } from "./config"

export async function resolveLocale(): Promise<Locale> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("locale")
        .eq("id", user.id)
        .maybeSingle<{ locale: string | null }>()
      if (profile?.locale && isLocale(profile.locale)) {
        return profile.locale
      }
    }
  } catch (err) {
    console.warn("[i18n/resolveLocale] profile lookup failed:", err)
  }

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(cookieLocale)) return cookieLocale

  const headerStore = await headers()
  const accept = parseAcceptLanguage(headerStore.get("accept-language"))
  if (accept) return accept

  return defaultLocale
}

export function getDateFnsLocale(locale: Locale): DateFnsLocale {
  return locale === "pt" ? ptLocale : enUS
}
