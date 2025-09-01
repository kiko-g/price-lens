import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { AUTH_CONFIG } from "@/lib/auth-config"

export const createClient = () => {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      // Use centralized auth configuration
      autoRefreshToken: AUTH_CONFIG.session.autoRefreshToken,
      persistSession: AUTH_CONFIG.session.persistSession,
      flowType: AUTH_CONFIG.session.flowType,
      storageKey: AUTH_CONFIG.session.storageKey,
    },
    cookies: {
      async getAll() {
        const cookieStore = await cookies()
        return cookieStore.getAll()
      },
      async setAll(cookiesToSet) {
        try {
          const cookieStore = await cookies()
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              // Use centralized cookie configuration
              httpOnly: AUTH_CONFIG.cookies.httpOnly,
              secure: AUTH_CONFIG.cookies.secure,
              sameSite: AUTH_CONFIG.cookies.sameSite,
              path: AUTH_CONFIG.cookies.path,
              maxAge: AUTH_CONFIG.cookies.maxAge,
            })
          })
        } catch (error) {
          console.error("Error setting cookies:", error)
        }
      },
    },
    global: {
      headers: {
        "X-Client-Info": "price-lens-server",
      },
    },
  })
}
