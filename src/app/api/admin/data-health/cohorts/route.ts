import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import type { CohortResponse, CohortType } from "@/types/data-health"

const SAMPLE_LIMIT = 50
const VALID_TYPES: CohortType[] = ["zombie", "skeleton", "false_zombie", "parked"]

const COHORT_COLUMNS = "id, origin_id, name, barcode, available, scraped_at, last_http_status, priority, priority_source, url"

/**
 * GET /api/admin/data-health/cohorts?type=zombie|false_zombie|skeleton|parked&origin=1
 * Returns aggregate count + capped sample for cohort review.
 */
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") as CohortType | null
    const originParam = req.nextUrl.searchParams.get("origin")
    const originId = originParam ? parseInt(originParam, 10) : null

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }

    const supabase = createAdminClient()

    let countQuery = supabase.from("store_products").select("id", { count: "exact", head: true })
    let sampleQuery = supabase.from("store_products").select(COHORT_COLUMNS).limit(SAMPLE_LIMIT)

    switch (type) {
      case "zombie":
        countQuery = countQuery.eq("available", false).lt("scraped_at", new Date(Date.now() - 30 * 86400000).toISOString())
        sampleQuery = sampleQuery
          .eq("available", false)
          .lt("scraped_at", new Date(Date.now() - 30 * 86400000).toISOString())
          .order("scraped_at", { ascending: true })
        break
      case "false_zombie":
        countQuery = countQuery.eq("available", false).eq("last_http_status", 200)
        sampleQuery = sampleQuery
          .eq("available", false)
          .eq("last_http_status", 200)
          .order("scraped_at", { ascending: true })
        break
      case "skeleton":
        countQuery = countQuery.is("priority", null).is("name", null)
        sampleQuery = sampleQuery.is("priority", null).is("name", null).order("created_at", { ascending: true })
        break
      case "parked":
        countQuery = countQuery.eq("priority_source", "unmapped")
        sampleQuery = sampleQuery.eq("priority_source", "unmapped").order("updated_at", { ascending: false })
        break
    }

    if (originId) {
      countQuery = countQuery.eq("origin_id", originId)
      sampleQuery = sampleQuery.eq("origin_id", originId)
    }

    const [{ count, error: countError }, { data: sample, error: sampleError }] = await Promise.all([
      countQuery,
      sampleQuery,
    ])

    if (countError) throw new Error(`Count error: ${countError.message}`)
    if (sampleError) throw new Error(`Sample error: ${sampleError.message}`)

    const response: CohortResponse = {
      type,
      total: count ?? 0,
      sample: sample ?? [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[admin/data-health/cohorts] GET error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
