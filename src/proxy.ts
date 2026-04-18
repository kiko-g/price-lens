import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { LOCALE_COOKIE, isLocale, parseAcceptLanguage } from "@/i18n/config"

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  const existing = request.cookies.get(LOCALE_COOKIE)?.value
  if (!isLocale(existing)) {
    const detected = parseAcceptLanguage(request.headers.get("accept-language"))
    if (detected) {
      response.cookies.set(LOCALE_COOKIE, detected, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more exceptions.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
