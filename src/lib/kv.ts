import { createClient } from "redis"

// Check if Redis is available
const isRedisAvailable = !!process.env.REDIS_URL

// Store Products Cache Configuration
const STORE_PRODUCTS_CACHE_PREFIX = "store-products:"
const STORE_PRODUCTS_CACHE_TTL = parseInt(process.env.STORE_PRODUCTS_CACHE_TTL_SECONDS || "120", 10)

// Single Store Product Cache Configuration
const SINGLE_PRODUCT_CACHE_PREFIX = "store-product:"
const SINGLE_PRODUCT_CACHE_TTL = 60 // 1 minute

// Related/Cross-Store Products Cache Configuration
const RELATED_PRODUCTS_CACHE_PREFIX = "related-products:"
const CROSS_STORE_CACHE_PREFIX = "cross-store:"
const RELATED_PRODUCTS_CACHE_TTL = 300 // 5 minutes (rarely changes)

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
// Store Products Cache
// ============================================================================

/**
 * Check if store products caching is enabled.
 * Requires REDIS_URL and ENABLE_STORE_PRODUCTS_CACHE !== "false".
 * When disabled, /api/store_products cold requests hit DB directly (slower).
 */
export function isStoreProductsCacheEnabled(): boolean {
  return isRedisAvailable && process.env.ENABLE_STORE_PRODUCTS_CACHE !== "false"
}

/**
 * Get cached store products query result.
 * @param cacheKey - Unique key for the query (typically JSON.stringify of query params)
 * @returns Cached data or null if not found/expired
 */
export async function getCachedStoreProducts<T>(cacheKey: string): Promise<T | null> {
  if (!isRedisAvailable || !redis) {
    return null
  }

  try {
    const fullKey = `${STORE_PRODUCTS_CACHE_PREFIX}${cacheKey}`
    const data = await redis.get(fullKey)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error fetching store products from cache:", error)
    return null
  }
}

/**
 * Cache store products query result.
 * @param cacheKey - Unique key for the query
 * @param data - Query result to cache
 */
export async function setCachedStoreProducts(cacheKey: string, data: any): Promise<void> {
  if (!isRedisAvailable || !redis) {
    return
  }

  try {
    const fullKey = `${STORE_PRODUCTS_CACHE_PREFIX}${cacheKey}`
    await redis.setEx(fullKey, STORE_PRODUCTS_CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.error("Error caching store products:", error)
  }
}

/**
 * Clear all store products cache entries.
 * Useful after bulk updates or when you need to force fresh data.
 */
export async function clearStoreProductsCache(): Promise<void> {
  if (!isRedisAvailable || !redis) {
    console.log("Redis not available, skipping cache clear")
    return
  }

  try {
    const keys = await redis.keys(`${STORE_PRODUCTS_CACHE_PREFIX}*`)
    if (keys.length > 0) {
      await redis.del(keys)
      console.log(`Cleared ${keys.length} store products cache entries`)
    }
  } catch (error) {
    console.error("Error clearing store products cache:", error)
  }
}

// ============================================================================
// Single Store Product Cache
// ============================================================================

/**
 * Get cached single store product by ID.
 */
export async function getCachedSingleProduct<T>(productId: string): Promise<T | null> {
  if (!isRedisAvailable || !redis) {
    return null
  }

  try {
    const key = `${SINGLE_PRODUCT_CACHE_PREFIX}${productId}`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error fetching single product from cache:", error)
    return null
  }
}

/**
 * Cache a single store product.
 */
export async function setCachedSingleProduct(productId: string, data: unknown): Promise<void> {
  if (!isRedisAvailable || !redis) {
    return
  }

  try {
    const key = `${SINGLE_PRODUCT_CACHE_PREFIX}${productId}`
    await redis.setEx(key, SINGLE_PRODUCT_CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.error("Error caching single product:", error)
  }
}

/**
 * Invalidate a single product cache entry.
 */
export async function invalidateSingleProductCache(productId: string): Promise<void> {
  if (!isRedisAvailable || !redis) {
    return
  }

  try {
    const key = `${SINGLE_PRODUCT_CACHE_PREFIX}${productId}`
    await redis.del(key)
  } catch (error) {
    console.error("Error invalidating single product cache:", error)
  }
}

// ============================================================================
// Related Products Cache
// ============================================================================

/**
 * Get cached related products for a product ID.
 */
export async function getCachedRelatedProducts<T>(productId: string, limit: number): Promise<T | null> {
  if (!isRedisAvailable || !redis) {
    return null
  }

  try {
    const key = `${RELATED_PRODUCTS_CACHE_PREFIX}${productId}:${limit}`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error fetching related products from cache:", error)
    return null
  }
}

/**
 * Cache related products for a product ID.
 */
export async function setCachedRelatedProducts(productId: string, limit: number, data: unknown): Promise<void> {
  if (!isRedisAvailable || !redis) {
    return
  }

  try {
    const key = `${RELATED_PRODUCTS_CACHE_PREFIX}${productId}:${limit}`
    await redis.setEx(key, RELATED_PRODUCTS_CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.error("Error caching related products:", error)
  }
}

// ============================================================================
// Cross-Store Products Cache
// ============================================================================

/**
 * Get cached cross-store (identical) products for a product ID.
 */
export async function getCachedCrossStoreProducts<T>(productId: string, limit: number): Promise<T | null> {
  if (!isRedisAvailable || !redis) {
    return null
  }

  try {
    const key = `${CROSS_STORE_CACHE_PREFIX}${productId}:${limit}`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error fetching cross-store products from cache:", error)
    return null
  }
}

/**
 * Cache cross-store (identical) products for a product ID.
 */
export async function setCachedCrossStoreProducts(productId: string, limit: number, data: unknown): Promise<void> {
  if (!isRedisAvailable || !redis) {
    return
  }

  try {
    const key = `${CROSS_STORE_CACHE_PREFIX}${productId}:${limit}`
    await redis.setEx(key, RELATED_PRODUCTS_CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.error("Error caching cross-store products:", error)
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
    onlyUrl?: boolean
    category?: string
  }
  total: number
  processed: number
  failed: number
  barcodesFound: number
  lastProcessedId?: number // Cursor for ID-based pagination
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
