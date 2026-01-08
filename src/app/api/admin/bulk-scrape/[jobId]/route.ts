import { NextRequest, NextResponse } from "next/server"
import { getBulkScrapeJob, updateBulkScrapeJob } from "@/lib/kv"

/**
 * GET /api/admin/bulk-scrape/[jobId]
 * Returns the current status of a bulk scrape job
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  const job = await getBulkScrapeJob(jobId)

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  // Calculate derived stats
  const elapsedMs = Date.now() - new Date(job.startedAt).getTime()
  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const rate = elapsedSeconds > 0 ? (job.processed / elapsedSeconds).toFixed(1) : "0"
  const progress = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0

  // Estimate remaining time
  const remaining = job.total - job.processed
  const rateNum = parseFloat(rate)
  const etaSeconds = rateNum > 0 ? Math.ceil(remaining / rateNum) : null

  return NextResponse.json({
    ...job,
    stats: {
      progress,
      rate: `${rate}/sec`,
      elapsedSeconds,
      etaSeconds,
      remaining,
    },
  })
}

/**
 * DELETE /api/admin/bulk-scrape/[jobId]
 * Cancels a running job (note: already-queued messages will still process)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  const job = await getBulkScrapeJob(jobId)

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  if (job.status === "completed" || job.status === "cancelled") {
    return NextResponse.json({ error: "Job already finished" }, { status: 400 })
  }

  await updateBulkScrapeJob(jobId, {
    status: "cancelled",
    completedAt: new Date().toISOString(),
  })

  return NextResponse.json({
    message: "Job cancelled",
    note: "Already-queued messages may still be processed",
  })
}
