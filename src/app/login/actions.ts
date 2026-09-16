"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

const REVIEWER_LOGIN_PATH = "/login/reviewer"

const safeNextPath = (raw: unknown): string =>
  typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/profile"

/**
 * Email + password sign-in used by the dedicated reviewer account (and any other
 * password user created via the Supabase admin API). Consumers keep Google OAuth;
 * this action is only reachable from /login/reviewer and never creates accounts.
 */
export async function signInWithPassword(formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")
  const next = safeNextPath(formData.get("next"))

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    redirect(`${REVIEWER_LOGIN_PATH}?error=missing`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

  if (error) {
    console.error("[signInWithPassword] failed:", error.message)
    redirect(`${REVIEWER_LOGIN_PATH}?error=invalid&next=${encodeURIComponent(next)}`)
  }

  revalidatePath("/", "layout")
  redirect(next)
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient()
  const origin = (await headers()).get("origin")
  const next = formData.get("next") as string | null

  if (!origin) {
    return redirect("/login?error=origin-missing")
  }

  const callbackUrl = next ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` : `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error) {
    console.error(error)
    redirect("/error")
  }

  return redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
}

export async function deleteAccount() {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/")
      return
    }

    console.log("Deleting account data for user:", user.id)

    // Delete user favorites (ignore errors)
    await supabase.from("user_favorites").delete().eq("user_id", user.id)

    // Delete user profile (ignore errors)
    await supabase.from("profiles").delete().eq("id", user.id)

    // Sign out the user
    await supabase.auth.signOut()

    console.log("Account deletion completed")
  } catch (error) {
    console.error("Error during account deletion:", error)
  }

  // Always redirect to home, regardless of errors
  revalidatePath("/", "layout")
  redirect("/")
}
