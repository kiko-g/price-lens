"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect("/error")
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect("/error")
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  let origin = (await headers()).get("origin")

  if (!origin) {
    return redirect("/login?error=origin-missing")
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
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
