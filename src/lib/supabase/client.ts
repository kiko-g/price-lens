import { createBrowserClient } from "@supabase/ssr"
import { AUTH_CONFIG } from "@/lib/auth-config"

export const createClient = () => {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      // Use centralized auth configuration
      autoRefreshToken: AUTH_CONFIG.session.autoRefreshToken,
      persistSession: AUTH_CONFIG.session.persistSession,
      detectSessionInUrl: AUTH_CONFIG.session.detectSessionInUrl,
      flowType: AUTH_CONFIG.session.flowType,
      storageKey: AUTH_CONFIG.session.storageKey,
      // Storage type - localStorage for better persistence
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
    global: {
      headers: {
        "X-Client-Info": "price-lens-web",
      },
    },
  })
}
