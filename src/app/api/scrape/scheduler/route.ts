import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { qstash, getBaseUrl, PRIORITY_REFRESH_HOURS, ACTIVE_PRIORITIES, BATCH_SIZE } from "@/lib/qstash"

export const maxDuration = 60 // 1 minute to schedule all jobs

/**
 * Scheduler endpoint - triggered by Vercel cron every 6 hours.
 *
 * Fetches stale products by priority and fans out to QStash,
 * which will call the worker endpoint for each product.
 *
 * Schedule configuration is defined in PRIORITY_REFRESH_HOURS.
 * Only priorities in ACTIVE_PRIORITIES are processed.
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()

  // Verify cron secret in production
  const authHeader = req.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const baseUrl = getBaseUrl()
    const workerUrl = `${baseUrl}/api/scrape/worker`

    // Process active priority levels from highest to lowest
    let totalScheduled = 0
    const results: Record<number, number> = {}

    for (const priority of ACTIVE_PRIORITIES) {
      const hoursThreshold = PRIORITY_REFRESH_HOURS[priority] || 24
      const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString()

      // Fetch stale products for this priority
      const { data: products, error } = await supabase
        .from("store_products")
        .select("id, url, name, origin_id, priority")
        .eq("priority", priority)
        .or(`updated_at.lt.${cutoffTime},updated_at.is.null`)
        .not("url", "is", null)
        .limit(500)

      if (error) {
        console.error(`Error fetching priority ${priority} products:`, error)
        results[priority] = 0
        continue
      }

      if (!products || products.length === 0) {
        console.info(`No stale products for priority ${priority}`)
        results[priority] = 0
        continue
      }

      // Fan out to QStash in batches
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE)

        // Use QStash batch publish for efficiency
        const messages = batch.map((product) => ({
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

        try {
          await qstash.batchJSON(messages)
        } catch (qstashError) {
          console.error(`QStash batch error for priority ${priority}:`, qstashError)
        }
      }

      totalScheduled += products.length
      results[priority] = products.length
      console.info(`Scheduled ${products.length} products for priority ${priority}`)
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      message: `Scheduled ${totalScheduled} products for scraping`,
      duration,
      breakdown: results,
    })
  } catch (error) {
    console.error("Scheduler error:", error)
    return NextResponse.json(
      { error: "Scheduler failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
