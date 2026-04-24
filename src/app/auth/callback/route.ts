import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // validate `next` as a safe same-origin path (prevent open redirects like //evil.example)
  const raw = searchParams.get("next") ?? "/"
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/"

  const oauthErr = searchParams.get("error_description") ?? searchParams.get("error")
  if (process.env.NODE_ENV === "development" && oauthErr) {
    console.error("[auth/callback] OAuth redirect error param:", oauthErr)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const separator = next.includes("?") ? "&" : "?"
      return NextResponse.redirect(`${origin}${next}${separator}welcome=1`)
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[auth/callback] exchangeCodeForSession failed:", error.message, error)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
