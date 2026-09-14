import "server-only"

import { cache } from "react"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/server"
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

async function fetchStoredBrandSettings(): Promise<unknown> {
  const supabase = createPublicClient()
  if (!supabase) {
    console.warn("[brand] Supabase env missing, using BRAND_DEFAULTS")
    return null
  }

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", BRAND_SETTINGS_KEY)
    .maybeSingle()

  if (error) {
    // Table missing (migration not applied yet) or transient failure: brand must never take the site down.
    console.warn("[brand] failed to load brand settings, using BRAND_DEFAULTS:", error.message)
    return null
  }

  return data?.value ?? null
}

const getCachedBrandSettings = unstable_cache(
  async (): Promise<BrandSettings> => mergeBrandSettings(await fetchStoredBrandSettings()),
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
  return mergeBrandSettings(await fetchStoredBrandSettings())
}

export async function saveBrandSettings(input: BrandSettingsInput, updatedBy: string | null): Promise<BrandSettings> {
  const brand = brandSettingsSchema.parse(input)
  const supabase = createAdminClient()

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: BRAND_SETTINGS_KEY,
      value: brand,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    },
    { onConflict: "key" },
  )

  if (error) throw new Error(`Failed to save brand settings: ${error.message}`)

  revalidateTag(BRAND_CACHE_TAG, "max")
  // Brand name is baked into metadata, manifest and messages on every route.
  revalidatePath("/", "layout")

  return brand
}
