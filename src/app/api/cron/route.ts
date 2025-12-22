import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { qstash, getBaseUrl } from "@/lib/qstash"

export const maxDuration = 60

/**
 * ADMIN / MANUAL TRIGGER
 *
 * This endpoint is NOT the automatic scheduler.
 * It is a utility to manually force a scrape for:
 * 1. A specific priority level (e.g., re-scrape all priority 5s now)
 * 2. Specific product IDs (e.g., debugging a product)
 *
 * The main scheduler is located at /api/scrape/scheduler
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const priority = searchParams.get("priority")
    const idsParam = searchParams.get("ids")

    const supabase = createClient()
    const baseUrl = getBaseUrl()
    const workerUrl = `${baseUrl}/api/scrape/worker`

    let products: {
      id: number
      url: string | null
      name: string | null
      origin_id: number | null
      priority: number | null
    }[] = []

    // If specific product IDs are provided
    if (idsParam) {
      const productIds = idsParam
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id))

      if (productIds.length === 0) {
        return NextResponse.json({ error: "Invalid product IDs" }, { status: 400 })
      }

      const { data } = await supabase
        .from("store_products")
        .select("id, url, name, origin_id, priority")
        .in("id", productIds)

      products = data || []
    }
    // If priority level is provided
    else if (priority) {
      const priorityNum = parseInt(priority, 10)

      if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 5) {
        return NextResponse.json({ error: "Priority must be between 1 and 5" }, { status: 400 })
      }

      const { data } = await supabase
        .from("store_products")
        .select("id, url, name, origin_id, priority")
        .eq("priority", priorityNum)
        .not("url", "is", null)
        .limit(100)

      products = data || []
    } else {
      return NextResponse.json(
        {
          error: "Missing required parameter",
          usage: {
            priority: "GET /api/cron?priority=5",
            ids: "GET /api/cron?ids=123,456,789",
          },
        },
        { status: 400 },
      )
    }

    if (products.length === 0) {
      return NextResponse.json({ message: "No products found to scrape" })
    }

    // Fan out to QStash
    const messages = products
      .filter((p) => p.url && p.origin_id)
      .map((product) => ({
        url: workerUrl,
        body: JSON.stringify({
          productId: product.id,
          url: product.url,
          name: product.name,
          originId: product.origin_id,
          priority: product.priority,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        retries: 3,
      }))

    await qstash.batchJSON(messages)

    return NextResponse.json({
      message: `Triggered scrape for ${messages.length} products`,
      count: messages.length,
    })
  } catch (error) {
    console.error("Error triggering scrape:", error)
    return NextResponse.json(
      { error: "Failed to trigger scrape", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
