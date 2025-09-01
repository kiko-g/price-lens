import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { AUTH_CONFIG, isProtectedRoute, getAuthErrorMessage } from "@/lib/auth-config"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use centralized auth configuration
        autoRefreshToken: AUTH_CONFIG.session.autoRefreshToken,
        persistSession: AUTH_CONFIG.session.persistSession,
        flowType: AUTH_CONFIG.session.flowType,
        storageKey: AUTH_CONFIG.session.storageKey,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Use centralized cookie configuration
              httpOnly: AUTH_CONFIG.cookies.httpOnly,
              secure: AUTH_CONFIG.cookies.secure,
              sameSite: AUTH_CONFIG.cookies.sameSite,
              path: AUTH_CONFIG.cookies.path,
              maxAge: AUTH_CONFIG.cookies.maxAge,
            })
          })
        },
      },
      global: {
        headers: {
          "X-Client-Info": "price-lens-middleware",
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Handle authentication errors gracefully
    if (error) {
      console.error("Auth error in middleware:", error.message)
      // Log auth changes in development
      if (AUTH_CONFIG.development.logAuthChanges) {
        console.log("Auth state change in middleware:", { error: error.message })
      }
      // Don't redirect on auth errors, let the client handle them
    }

    const { pathname } = request.nextUrl

    // Use centralized protected routes check
    if (!user && isProtectedRoute(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      // store the intended path to redirect back after login
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
  } catch (error) {
    console.error("Unexpected error in middleware:", error)
    // Return the response even if there's an error to prevent breaking the app
    return supabaseResponse
  }
}
