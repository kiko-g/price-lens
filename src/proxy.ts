import createMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { routing } from "@/i18n/routing"
import { updateSession } from "@/lib/supabase/middleware"

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    pathname.includes(".") // Static files
  ) {
    // For API routes, still run Supabase auth middleware
    if (pathname.startsWith("/api/")) {
      return await updateSession(request)
    }
    return NextResponse.next()
  }

  // Run next-intl middleware for locale handling
  const intlResponse = intlMiddleware(request)

  // Run Supabase session update (handles auth and protected routes)
  const supabaseResponse = await updateSession(request)

  // If Supabase returns a redirect (e.g., to login), use that response
  if (supabaseResponse.headers.get("location")) {
    return supabaseResponse
  }

  // Copy Supabase cookies to the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return intlResponse
}

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - API routes that don't need locale
    // - Static files
    // - Next.js internals
    "/((?!_next|icons|.*\\..*).*)",
  ],
}
