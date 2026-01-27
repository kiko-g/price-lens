import type { StoreCategoryTuple } from "@/types"

/**
 * In-memory cache for category-related data
 * Used to avoid expensive database queries on every request
 */

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Stats cache
let statsCache: { data: any; timestamp: number } | null = null

// Tuples cache
let tuplesCache: { data: StoreCategoryTuple[]; timestamp: number } | null = null

export const categoryCache = {
  // Stats cache methods
  getStats() {
    if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
      return { data: statsCache.data, cached: true }
    }
    return null
  },

  setStats(data: any) {
    statsCache = { data, timestamp: Date.now() }
  },

  // Tuples cache methods
  getTuples() {
    if (tuplesCache && Date.now() - tuplesCache.timestamp < CACHE_TTL) {
      return { data: tuplesCache.data, cached: true }
    }
    return null
  },

  setTuples(data: StoreCategoryTuple[]) {
    tuplesCache = { data, timestamp: Date.now() }
  },

  // Invalidate all caches (called when mappings change)
  invalidateAll() {
    statsCache = null
    tuplesCache = null
  },

  // Invalidate just tuples (mappings affect tuple is_mapped status)
  invalidateTuples() {
    tuplesCache = null
  },

  // Get cache status for debugging
  getStatus() {
    return {
      statsAge: statsCache ? Date.now() - statsCache.timestamp : null,
      tuplesAge: tuplesCache ? Date.now() - tuplesCache.timestamp : null,
      tuplesCount: tuplesCache?.data.length ?? 0,
    }
  },
}
