"use server"

import { storeProductQueries } from "@/lib/queries/products"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { canMutateAdmin } from "@/lib/auth/roles"

/**
 * Server actions can be invoked from any page URL once their id is known, so the
 * /admin method rule in the middleware is not enough: re-check the role here.
 */
async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Unauthorized" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!canMutateAdmin(profile?.role)) return { ok: false, error: "Forbidden: admin role required" }
  return { ok: true }
}

export async function updateProductPriority(productId: number, priority: number) {
  const auth = await assertAdmin()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  if (priority < 0 || priority > 5 || !Number.isInteger(priority)) {
    return {
      success: false,
      error: "Priority must be an integer between 0 and 5",
    }
  }

  const { data, error } = await storeProductQueries.updatePriority(productId, priority, {
    updateTimestamp: true,
    source: "manual",
  })

  if (error) {
    console.error("Failed to update priority:", error)
    return {
      success: false,
      error: "Failed to update priority",
    }
  }

  revalidatePath("/admin/priorities")

  return {
    success: true,
    data,
  }
}
