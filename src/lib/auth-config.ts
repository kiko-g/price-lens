// Authentication configuration for Price Lens
// This file centralizes all auth-related settings for consistency and maintainability

export const AUTH_CONFIG = {
  // Session configuration
  session: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session across browser sessions
    persistSession: true,
    // Detect session in URL for OAuth flows
    detectSessionInUrl: true,
    // Use PKCE flow for better security
    flowType: "pkce" as const,
    // Custom storage key for better identification
    storageKey: "price-lens-auth",
    // Session refresh interval (30 minutes)
    refreshInterval: 30 * 60 * 1000,
  },

  // Cookie configuration
  cookies: {
    // Cookie security settings
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    // 7 days max age for better persistence
    maxAge: 60 * 60 * 24 * 7,
  },

  // Protected routes that require authentication
  protectedRoutes: ["/profile", "/admin", "/favorites", "/tracked"],

  // OAuth configuration
  oauth: {
    google: {
      redirectTo: "/auth/callback",
    },
  },

  // Error handling
  errors: {
    // Common auth error messages
    messages: {
      sessionExpired: "Your session has expired. Please log in again.",
      networkError: "Network error. Please check your connection.",
      invalidCredentials: "Invalid email or password.",
      userNotFound: "User not found.",
      tooManyRequests: "Too many requests. Please try again later.",
      unknown: "An unexpected error occurred. Please try again.",
    },
  },

  // Development settings
  development: {
    // Enable session monitoring in development
    enableSessionMonitor: process.env.NODE_ENV === "development",
    // Log auth state changes in development
    logAuthChanges: process.env.NODE_ENV === "development",
  },
} as const

// Helper function to check if a route is protected
export function isProtectedRoute(pathname: string): boolean {
  return AUTH_CONFIG.protectedRoutes.some((route) => pathname.startsWith(route))
}

// Helper function to get error message
export function getAuthErrorMessage(errorCode: string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": AUTH_CONFIG.errors.messages.invalidCredentials,
    "User not found": AUTH_CONFIG.errors.messages.userNotFound,
    "Too many requests": AUTH_CONFIG.errors.messages.tooManyRequests,
    "Network error": AUTH_CONFIG.errors.messages.networkError,
  }

  return errorMap[errorCode] || AUTH_CONFIG.errors.messages.unknown
}

// Helper function to format session expiry time
export function formatSessionExpiry(expiresAt: number | null): string {
  if (!expiresAt) return "Unknown"

  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = expiresAt - now

  if (timeUntilExpiry <= 0) return "Expired"

  const hours = Math.floor(timeUntilExpiry / 3600)
  const minutes = Math.floor((timeUntilExpiry % 3600) / 60)
  const seconds = timeUntilExpiry % 60

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}
