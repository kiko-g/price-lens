import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const DEV_EMAIL = process.env.DEV_USER_EMAIL || "dev@pricelens.dev"

/**
 * Development-only passwordless login via magic link.
 * Uses the admin client to generate a magic link for a test account,
 * creating the user if they don't exist yet.
 *
 * Flow: /api/auth/dev-login → Supabase verify → /auth/callback → session set
 *
 * Never available in production.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development" }, { status: 403 })
  }

  const supabase = createAdminClient()
  const origin = new URL(req.url).origin

  // Ensure the dev user exists — idempotent, ignores "already exists" errors
  await supabase.auth.admin
    .createUser({
      email: DEV_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: "Dev User" },
    })
    .catch(() => {})

  // Generate a one-time magic link that redirects back through our auth callback
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: DEV_EMAIL,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.properties?.action_link) {
    return NextResponse.json({ error: error?.message || "Failed to generate magic link" }, { status: 500 })
  }

  return NextResponse.redirect(data.properties.action_link)
}
