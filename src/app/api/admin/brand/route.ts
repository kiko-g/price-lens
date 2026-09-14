import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { createClient } from "@/lib/supabase/server"
import { resolveUser } from "@/lib/supabase/tools"
import { brandSettingsSchema, BRAND_SETTINGS_KEY } from "@/lib/brand/brand"
import { getBrandUncached, saveBrandSettings } from "@/lib/brand/server"

export const dynamic = "force-dynamic"

// Auth: middleware (src/lib/supabase/middleware.ts) already enforces the admin role for /api/admin/*.

/** GET /api/admin/brand — latest stored brand settings merged over defaults. */
export async function GET() {
  try {
    const supabase = createClient()
    const [brand, { data: row }] = await Promise.all([
      getBrandUncached(),
      supabase.from("app_settings").select("updated_at").eq("key", BRAND_SETTINGS_KEY).maybeSingle(),
    ])
    return NextResponse.json({ brand, updatedAt: row?.updated_at ?? null })
  } catch (error) {
    console.error("[admin/brand] GET error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

/** PUT /api/admin/brand — validate and persist brand settings, then bust the brand cache. */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const input = brandSettingsSchema.parse(body)

    const supabase = createClient()
    const user = await resolveUser(supabase)
    const brand = await saveBrandSettings(input, user?.id ?? null)

    return NextResponse.json({ brand, updatedAt: new Date().toISOString() })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid brand settings", issues: error.issues }, { status: 400 })
    }
    console.error("[admin/brand] PUT error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
