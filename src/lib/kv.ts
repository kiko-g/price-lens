import { createClient } from "redis"

// Check if Redis is available
const isRedisAvailable = !!process.env.REDIS_URL

// Create Redis client
const redis = isRedisAvailable
  ? createClient({
      url: process.env.REDIS_URL,
    })
  : null

// Connect to Redis if available
if (redis) {
  redis.on("error", (err) => console.error("Redis Client Error", err))
  // Connect only once
  if (!redis.isOpen) {
    redis.connect().catch(console.error)
  }
}

export async function getLastProcessedId(): Promise<number> {
  if (!isRedisAvailable || !redis) {
    return 0
  }

  try {
    const id = await redis.get("lastProcessedProductId")
    return id ? parseInt(id, 10) : 0
  } catch (error) {
    console.error("Error getting last processed ID:", error)
    return 0
  }
}

export async function setLastProcessedId(id: number): Promise<void> {
  if (!isRedisAvailable || !redis) {
    console.log("Redis not available, skipping set last processed ID")
    return
  }

  try {
    await redis.set("lastProcessedProductId", id.toString())
  } catch (error) {
    console.error("Error setting last processed ID:", error)
  }
}

export async function clearCategoriesCache(): Promise<void> {
  if (!isRedisAvailable || !redis) {
    console.log("Redis not available, skipping cache clear")
    return
  }

  try {
    const keys = await redis.keys("categories:*")
    if (keys.length > 0) {
      await redis.del(keys)
      console.log(`Cleared ${keys.length} category cache entries`)
    }
  } catch (error) {
    console.error("Error clearing categories cache:", error)
  }
}

export async function getCachedCategories(cacheKey: string) {
  if (!isRedisAvailable || !redis) {
    return null
  }

  try {
    const data = await redis.get(cacheKey)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error fetching from cache:", error)
    return null
  }
}

export async function setCachedCategories(cacheKey: string, data: any, ttl: number = 7 * 24 * 60 * 60) {
  if (!isRedisAvailable || !redis) {
    console.log("Redis not available, skipping cache set")
    return
  }

  try {
    await redis.setEx(cacheKey, ttl, JSON.stringify(data))
  } catch (error) {
    console.error("Error setting cache:", error)
  }
}

// ============================================================================
// Bulk Scrape Job Tracking
// ============================================================================

export interface BulkScrapeJob {
  id: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  filters: {
    origins: number[]
    priorities: number[]
    missingBarcode: boolean
    available: boolean | null
    category?: string
  }
  total: number
  processed: number
  failed: number
  barcodesFound: number
  startedAt: string
  updatedAt: string
  completedAt?: string
  error?: string
}

const BULK_SCRAPE_JOB_PREFIX = "bulk-scrape-job:"
const BULK_SCRAPE_JOB_TTL = 24 * 60 * 60 // 24 hours

export async function createBulkScrapeJob(job: BulkScrapeJob): Promise<void> {
  if (!isRedisAvailable || !redis) {
    console.log("Redis not available, cannot create bulk scrape job")
    return
  }

  try {
    await redis.setEx(`${BULK_SCRAPE_JOB_PREFIX}${job.id}`, BULK_SCRAPE_JOB_TTL, JSON.stringify(job))
  } catch (error) {
    console.error("Error creating bulk scrape job:", error)
  }
}

export async function getBulkScrapeJob(jobId: string): Promise<BulkScrapeJob | null> {
  if (!isRedisAvailable || !redis) {
    return null
  }

  try {
    const data = await redis.get(`${BULK_SCRAPE_JOB_PREFIX}${jobId}`)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error getting bulk scrape job:", error)
    return null
  }
}

export async function updateBulkScrapeJob(jobId: string, updates: Partial<BulkScrapeJob>): Promise<void> {
  if (!isRedisAvailable || !redis) {
    return
  }

  try {
    const existing = await getBulkScrapeJob(jobId)
    if (!existing) return

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await redis.setEx(`${BULK_SCRAPE_JOB_PREFIX}${jobId}`, BULK_SCRAPE_JOB_TTL, JSON.stringify(updated))
  } catch (error) {
    console.error("Error updating bulk scrape job:", error)
  }
}

export async function incrementBulkScrapeProgress(
  jobId: string,
  options: { failed?: boolean; barcodeFound?: boolean } = {},
): Promise<void> {
  if (!isRedisAvailable || !redis) {
    return
  }

  try {
    const job = await getBulkScrapeJob(jobId)
    if (!job) return

    const updates: Partial<BulkScrapeJob> = {
      processed: job.processed + 1,
    }

    if (options.failed) {
      updates.failed = job.failed + 1
    }

    if (options.barcodeFound) {
      updates.barcodesFound = job.barcodesFound + 1
    }

    // Check if job is complete
    if (updates.processed === job.total) {
      updates.status = "completed"
      updates.completedAt = new Date().toISOString()
    }

    await updateBulkScrapeJob(jobId, updates)
  } catch (error) {
    console.error("Error incrementing bulk scrape progress:", error)
  }
}

export async function getActiveBulkScrapeJobs(): Promise<BulkScrapeJob[]> {
  if (!isRedisAvailable || !redis) {
    return []
  }

  try {
    const keys = await redis.keys(`${BULK_SCRAPE_JOB_PREFIX}*`)
    if (keys.length === 0) return []

    const jobs: BulkScrapeJob[] = []
    for (const key of keys) {
      const data = await redis.get(key)
      if (data) {
        const job = JSON.parse(data) as BulkScrapeJob
        jobs.push(job)
      }
    }

    // Sort by startedAt descending (most recent first)
    return jobs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  } catch (error) {
    console.error("Error getting active bulk scrape jobs:", error)
    return []
  }
}
