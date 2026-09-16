import "server-only"

import { cache } from "react"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/server"
import { brandStorageError } from "@/lib/brand/storage-error"
import type { Database } from "@/types/supabase"
import {
  BRAND_CACHE_TAG,
  BRAND_DEFAULTS,
  BRAND_SETTINGS_KEY,
  brandSettingsSchema,
  mergeBrandSettings,
  type BrandSettings,
  type BrandSettingsInput,
} from "./brand"

const BRAND_REVALIDATE_SECONDS = 300

/**
 * Cookie-less anon client: brand settings are public (RLS allows anon SELECT) and this lets the
 * read live inside `unstable_cache`, which cannot touch request cookies.
 */
function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return createSupabaseClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export type BrandSettingsSnapshot = { brand: BrandSettings; updatedAt: string | null }

export async function getBrandSnapshot(): Promise<BrandSettingsSnapshot> {
  const supabase = createPublicClient()
  if (!supabase)
    throw new Error(
      "Brand storage is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  const { data, error } = await supabase
    .from("app_settings")
    .select("value,updated_at")
    .eq("key", BRAND_SETTINGS_KEY)
    .maybeSingle()
  if (error) throw brandStorageError(error)
  return { brand: mergeBrandSettings(data?.value), updatedAt: data?.updated_at ?? null }
}

const getCachedBrandSettings = unstable_cache(
  async (): Promise<BrandSettings> => (await getBrandSnapshot()).brand,
  ["brand-settings"],
  { tags: [BRAND_CACHE_TAG], revalidate: BRAND_REVALIDATE_SECONDS },
)

/**
 * Server helper: resolved brand settings (stored overrides merged over defaults).
 * Deduped per request and cached across requests under `BRAND_CACHE_TAG`.
 */
export const getBrand = cache(async (): Promise<BrandSettings> => {
  try {
    return await getCachedBrandSettings()
  } catch (err) {
    console.error("[brand] getBrand failed, using BRAND_DEFAULTS:", err)
    return BRAND_DEFAULTS
  }
})

/** Uncached read for the admin editor so it always reflects the latest stored row. */
export async function getBrandUncached(): Promise<BrandSettings> {
  return (await getBrandSnapshot()).brand
}

export async function saveBrandSettings(
  input: BrandSettingsInput,
  updatedBy: string | null,
): Promise<BrandSettingsSnapshot> {
  const brand = brandSettingsSchema.parse(input)
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("app_settings")
    .upsert(
      {
        key: BRAND_SETTINGS_KEY,
        value: brand,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      },
      { onConflict: "key" },
    )
    .select("value,updated_at")
    .single()

  if (error) throw brandStorageError(error)
  if (!data) throw new Error("Brand storage did not confirm the saved settings.")

  revalidateTag(BRAND_CACHE_TAG, { expire: 0 })
  // Brand name is baked into metadata, manifest and messages on every route.
  revalidatePath("/", "layout")

  return { brand: mergeBrandSettings(data.value), updatedAt: data.updated_at }
}
