import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { createClient } from "@/lib/supabase/server"
import { resolveUser } from "@/lib/supabase/tools"
import { brandSettingsSchema } from "@/lib/brand/brand"
import { getBrandSnapshot, saveBrandSettings } from "@/lib/brand/server"

export const dynamic = "force-dynamic"

// Auth: middleware (src/lib/supabase/middleware.ts) already enforces the admin role for /api/admin/*.

/** GET /api/admin/brand — latest stored brand settings merged over defaults. */
export async function GET() {
  try {
    return NextResponse.json(await getBrandSnapshot(), { headers: { "Cache-Control": "no-store" } })
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
    const saved = await saveBrandSettings(input, user?.id ?? null)

    return NextResponse.json(saved, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 })
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid brand settings", issues: error.issues }, { status: 400 })
    }
    console.error("[admin/brand] PUT error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
