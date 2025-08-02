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
