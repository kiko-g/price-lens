import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

/**
 * Resolves the current user from auth cookies.
 * Returns null quickly if no Supabase auth cookie is present,
 * avoiding an unnecessary getUser() round-trip.
 */
export async function resolveUser(
  supabase: ReturnType<typeof createClient>,
): Promise<{ id: string } | null> {
  const hasAuthCookie = (await cookies()).getAll().some((c) => c.name.startsWith("sb-"))
  if (!hasAuthCookie) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}
