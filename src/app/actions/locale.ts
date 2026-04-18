"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config"

export async function setLocaleAction(locale: Locale): Promise<{ ok: boolean; error?: string }> {
  if (!isLocale(locale)) {
    return { ok: false, error: "invalid-locale" }
  }

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from("profiles").update({ locale }).eq("id", user.id)
      if (error) console.warn("[setLocaleAction] profile update failed:", error.message)
    }
  } catch (err) {
    console.warn("[setLocaleAction] supabase call failed:", err)
  }

  revalidatePath("/", "layout")
  return { ok: true }
}
