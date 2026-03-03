import { createClient } from "@/lib/supabase/server"
import type { StoreProduct } from "@/types"
import {
  brandsMatch,
  calculateNameSimilarity,
  calculatePricePerUnitSimilarity,
  calculateSizeSimilarity,
  extractWords,
  parseSize,
} from "@/lib/canonical/similarity"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductMatch {
  product: StoreProduct
  score: number
  factors: string[]
  nameSimilarity: number
  sizeSimilarity: number
  pricePerUnitSimilarity: number
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

/**
 * Scores a candidate product against a source product for "identical" matching
 */
function scoreIdenticalMatch(source: StoreProduct, candidate: StoreProduct): ProductMatch | null {
  const factors: string[] = []
  let score = 0

  // HARD REQUIREMENTS (must pass all)

  // 1. Must be from different store
  if (source.origin_id === candidate.origin_id) return null

  // 2. Brand must match
  if (!brandsMatch(source.brand, candidate.brand)) return null
  factors.push("brand_match")
  score += 30

  // 3. Parse sizes
  const sourceSize = parseSize(source.pack, source.major_unit)
  const candidateSize = parseSize(candidate.pack, candidate.major_unit)

  // 4. Size/unit must be compatible
  const sizeSimilarity = calculateSizeSimilarity(sourceSize, candidateSize)
  if (sizeSimilarity < 0.9) return null // Require 90%+ size match for identical
  factors.push(`size_${(sizeSimilarity * 100).toFixed(0)}%`)
  score += sizeSimilarity * 25

  // SOFT SCORING

  // 5. Name similarity (critical)
  const nameMatch = calculateNameSimilarity(source.name, candidate.name)
  if (nameMatch.similarity < 0.5) return null // Require 50%+ name match minimum
  factors.push(`name_${(nameMatch.similarity * 100).toFixed(0)}%`)
  score += nameMatch.similarity * 35

  // Bonus for no missing words
  if (nameMatch.missingWords.length === 0) {
    factors.push("all_words_match")
    score += 15
  }

  // 6. Price per unit similarity (good signal)
  const pricePerUnitSim = calculatePricePerUnitSimilarity(source.price_per_major_unit, candidate.price_per_major_unit)
  if (pricePerUnitSim > 0) {
    factors.push(`price_per_unit_${(pricePerUnitSim * 100).toFixed(0)}%`)
    score += pricePerUnitSim * 10
  }

  return {
    product: candidate,
    score,
    factors,
    nameSimilarity: nameMatch.similarity,
    sizeSimilarity,
    pricePerUnitSimilarity: pricePerUnitSim,
  }
}

/**
 * Scores a candidate product for "related" matching (same brand, similar category/type)
 */
function scoreRelatedMatch(source: StoreProduct, candidate: StoreProduct): ProductMatch | null {
  const factors: string[] = []
  let score = 0

  // Exclude self
  if (source.id === candidate.id) return null

  // Brand match is a big plus
  if (brandsMatch(source.brand, candidate.brand)) {
    factors.push("same_brand")
    score += 40
  }

  // Name similarity
  const nameMatch = calculateNameSimilarity(source.name, candidate.name)
  if (nameMatch.similarity > 0.2) {
    factors.push(`name_${(nameMatch.similarity * 100).toFixed(0)}%`)
    score += nameMatch.similarity * 30
  }

  // Size similarity (not required but helps)
  const sourceSize = parseSize(source.pack, source.major_unit)
  const candidateSize = parseSize(candidate.pack, candidate.major_unit)
  const sizeSimilarity = calculateSizeSimilarity(sourceSize, candidateSize)
  if (sizeSimilarity > 0) {
    factors.push(`size_${(sizeSimilarity * 100).toFixed(0)}%`)
    score += sizeSimilarity * 15
  }

  // Price per unit similarity
  const pricePerUnitSim = calculatePricePerUnitSimilarity(source.price_per_major_unit, candidate.price_per_major_unit)
  if (pricePerUnitSim > 0) {
    factors.push(`price_per_unit_${(pricePerUnitSim * 100).toFixed(0)}%`)
    score += pricePerUnitSim * 10
  }

  // Same category within store is relevant
  if (source.category && candidate.category && source.category === candidate.category) {
    factors.push("same_category")
    score += 10
  }

  // Minimum score threshold
  if (score < 20) return null

  return {
    product: candidate,
    score,
    factors,
    nameSimilarity: nameMatch.similarity,
    sizeSimilarity,
    pricePerUnitSimilarity: pricePerUnitSim,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function augmentWithFavorites<T extends { id: number }>(
  supabase: ReturnType<typeof createClient>,
  products: T[],
  userId: string | null,
): Promise<(T & { is_favorited: boolean })[]> {
  if (!userId || products.length === 0) {
    return products.map((p) => ({ ...p, is_favorited: false }))
  }

  const productIds = products.map((p) => p.id).filter(Boolean)

  const { data: favorites } = await supabase
    .from("user_favorites")
    .select("store_product_id")
    .eq("user_id", userId)
    .in("store_product_id", productIds)

  const favoriteIds = new Set(favorites?.map((f) => f.store_product_id) ?? [])

  return products.map((p) => ({
    ...p,
    is_favorited: favoriteIds.has(p.id),
  }))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Finds identical products from different stores.
 * Priority: 1) Canonical product match  2) Exact barcode  3) Fuzzy matching
 */
export async function findIdenticalProducts(
  productId: string,
  limit: number = 10,
  userId: string | null = null,
): Promise<{
  data: (StoreProduct & { similarity_score: number; similarity_factors: string[]; is_favorited: boolean })[] | null
  error: unknown
}> {
  const supabase = createClient()

  // Get source product
  const { data: source, error } = await supabase.from("store_products").select("*").eq("id", productId).single()

  if (error || !source) {
    return { data: null, error: error || "Product not found" }
  }

  // ── Fast path: canonical product layer ──────────────────────────────
  if (source.canonical_product_id) {
    const { data: canonicalMatches, error: canonErr } = await supabase
      .from("store_products")
      .select("*")
      .eq("canonical_product_id", source.canonical_product_id)
      .neq("origin_id", source.origin_id)
      .neq("id", productId)
      .limit(limit)

    if (!canonErr && canonicalMatches && canonicalMatches.length > 0) {
      const results = canonicalMatches.map((m) => ({
        ...m,
        similarity_score: 100,
        similarity_factors: ["same_canonical_product"],
      }))
      const augmented = await augmentWithFavorites(supabase, results, userId)
      return { data: augmented, error: null }
    }
  }

  // ── Fallback: barcode + fuzzy matching ──────────────────────────────

  const barcodeQuery = source.barcode
    ? supabase
        .from("store_products")
        .select("*")
        .eq("barcode", source.barcode)
        .neq("origin_id", source.origin_id)
        .neq("id", productId)
        .limit(limit)
    : null

  let fuzzyQuery = null
  if (source.brand) {
    const words = extractWords(source.name)
    let query = supabase
      .from("store_products")
      .select("*")
      .eq("brand", source.brand)
      .neq("origin_id", source.origin_id)
      .neq("id", productId)

    if (words.length >= 2) {
      const searchTerms = words.slice(0, 3).join(" & ")
      query = query.textSearch("name", searchTerms)
    }

    fuzzyQuery = query.limit(30)
  }

  const [barcodeResult, fuzzyResult] = await Promise.all([
    barcodeQuery ?? Promise.resolve(null),
    fuzzyQuery ?? Promise.resolve(null),
  ])

  // Process barcode matches (score 100)
  const results: (StoreProduct & { similarity_score: number; similarity_factors: string[] })[] = []
  const seenIds = new Set<number>()

  if (barcodeResult && !barcodeResult.error && barcodeResult.data) {
    for (const match of barcodeResult.data) {
      seenIds.add(match.id)
      results.push({ ...match, similarity_score: 100, similarity_factors: ["exact_barcode"] })
    }
  } else if (barcodeResult?.error) {
    console.warn("[findIdenticalProducts] barcode query failed:", barcodeResult.error.code, barcodeResult.error.message)
  }

  // Process fuzzy matches (score via scoreIdenticalMatch)
  if (fuzzyResult && !fuzzyResult.error && fuzzyResult.data) {
    const matches: ProductMatch[] = []
    for (const candidate of fuzzyResult.data) {
      if (seenIds.has(candidate.id)) continue
      const match = scoreIdenticalMatch(source, candidate)
      if (match && match.score > 50) matches.push(match)
    }

    matches.sort((a, b) => b.score - a.score)
    const remaining = limit - results.length
    for (const m of matches.slice(0, remaining)) {
      results.push({ ...m.product, similarity_score: m.score, similarity_factors: m.factors })
    }
  } else if (fuzzyResult?.error) {
    console.warn("[findIdenticalProducts] fuzzy query failed:", fuzzyResult.error.code, fuzzyResult.error.message)
  }

  results.sort((a, b) => b.similarity_score - a.similarity_score)

  const augmented = await augmentWithFavorites(supabase, results, userId)

  return { data: augmented, error: null }
}

/**
 * Finds related products (same brand, similar type, any store)
 */
export async function findRelatedProducts(
  productId: string,
  limit: number = 10,
  userId: string | null = null,
): Promise<{
  data: (StoreProduct & { similarity_score: number; similarity_factors: string[]; is_favorited: boolean })[] | null
  error: unknown
}> {
  const supabase = createClient()

  const { data: source, error } = await supabase.from("store_products").select("*").eq("id", productId).single()

  if (error || !source) {
    console.warn(`[findRelatedProducts] source product ${productId} not found`, error)
    return { data: null, error: error || "Product not found" }
  }

  const brandTrimmed = source.brand?.trim() || null

  const queries = []

  if (brandTrimmed) {
    queries.push(
      supabase.from("store_products").select("*").ilike("brand", brandTrimmed).neq("id", productId).limit(100),
    )
  }

  const words = extractWords(source.name)
  if (words.length >= 2) {
    const searchTerms = words.slice(0, 3).join(" & ")
    queries.push(
      supabase.from("store_products").select("*").textSearch("name", searchTerms).neq("id", productId).limit(100),
    )
  }

  const queryResults = await Promise.all(queries)
  const allCandidates = new Map<number, StoreProduct>()

  for (const result of queryResults) {
    if (result.error) {
      console.warn("[findRelatedProducts] candidate query failed:", result.error.code, result.error.message)
    }
    if (result.data) {
      for (const p of result.data) {
        allCandidates.set(p.id, p)
      }
    }
  }

  console.log(
    `[findRelatedProducts] id=${productId} brand="${brandTrimmed}" name="${source.name}" ` +
      `candidates=${allCandidates.size} queries=${queries.length}`,
  )

  const matches: ProductMatch[] = []
  for (const candidate of allCandidates.values()) {
    const match = scoreRelatedMatch(source, candidate)
    if (match) {
      matches.push(match)
    }
  }

  console.log(
    `[findRelatedProducts] id=${productId} scored=${matches.length}/${allCandidates.size} ` +
      `top=${matches[0]?.score ?? "n/a"}`,
  )

  matches.sort((a, b) => b.score - a.score)

  const final = matches.slice(0, limit).map((m) => ({
    ...m.product,
    similarity_score: m.score,
    similarity_factors: m.factors,
  }))

  const augmented = await augmentWithFavorites(supabase, final, userId)

  return { data: augmented, error: null }
}
