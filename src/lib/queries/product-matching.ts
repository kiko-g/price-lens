import { createClient } from "@/lib/supabase/server"
import type { StoreProduct } from "@/types"

/**
 * Product Matching Utilities
 *
 * Improved algorithms for finding identical and related products across stores.
 */

// Portuguese stop words to filter out
const STOP_WORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "com",
  "sem",
  "para",
  "por",
  "em",
  "na",
  "no",
  "nas",
  "nos",
  "e",
  "o",
  "a",
  "os",
  "as",
  "um",
  "uma",
  "uns",
  "umas",
  "ao",
  "aos",
  "à",
  "às",
  "pelo",
  "pela",
  "pelos",
  "pelas",
  "este",
  "esta",
  "esse",
  "essa",
  "aquele",
  "aquela",
  "que",
  "qual",
  "quais",
  "ou",
  "mais",
  "menos",
  "muito",
  "muita",
  "pouco",
  "pouca",
  "todo",
  "toda",
  "cada",
  "outro",
  "outra",
])

// Unit aliases for normalization
const UNIT_ALIASES: Record<string, string> = {
  l: "l",
  lt: "l",
  litro: "l",
  litros: "l",
  ltr: "l",
  ml: "ml",
  mililitro: "ml",
  mililitros: "ml",
  kg: "kg",
  kilo: "kg",
  kilos: "kg",
  quilos: "kg",
  quilo: "kg",
  g: "g",
  gr: "g",
  grama: "g",
  gramas: "g",
  un: "un",
  und: "un",
  unidade: "un",
  unidades: "un",
  cl: "cl",
  centilitro: "cl",
  centilitros: "cl",
}

// Unit conversion to base units (ml for liquids, g for weight)
const UNIT_TO_BASE: Record<string, { unit: string; multiplier: number }> = {
  l: { unit: "ml", multiplier: 1000 },
  ml: { unit: "ml", multiplier: 1 },
  cl: { unit: "ml", multiplier: 10 },
  kg: { unit: "g", multiplier: 1000 },
  g: { unit: "g", multiplier: 1 },
}

interface NormalizedSize {
  value: number
  unit: string
  baseValue: number // Converted to base unit (ml or g)
  baseUnit: string
}

interface ProductMatch {
  product: StoreProduct
  score: number
  factors: string[]
  nameSimilarity: number
  sizeSimilarity: number
  pricePerUnitSimilarity: number
}

/**
 * Normalizes a product name for comparison
 */
function normalizeName(name: string | null): string {
  if (!name) return ""
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s]/g, " ") // Replace special chars with space
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Extracts meaningful words from a product name
 */
function extractWords(name: string | null): string[] {
  if (!name) return []
  const normalized = normalizeName(name)
  return normalized.split(" ").filter((word) => word.length > 1 && !STOP_WORDS.has(word))
}

/**
 * Parses a pack/size string into normalized components
 * Examples: "1 L", "500ml", "1.5 Kg", "6x330ml"
 */
function parseSize(pack: string | null, majorUnit: string | null): NormalizedSize | null {
  if (!pack && !majorUnit) return null

  const input = (pack || "").toLowerCase().trim()

  // Try to extract number and unit
  // Patterns: "1 L", "500ml", "1.5kg", "6x330ml" (multi-pack)
  const multiPackMatch = input.match(/(\d+)\s*x\s*([\d.,]+)\s*([a-z]+)/i)
  const simpleMatch = input.match(/([\d.,]+)\s*([a-z]+)/i)

  let value: number
  let unitRaw: string

  if (multiPackMatch) {
    const count = parseFloat(multiPackMatch[1])
    const perUnit = parseFloat(multiPackMatch[2].replace(",", "."))
    value = count * perUnit
    unitRaw = multiPackMatch[3].toLowerCase()
  } else if (simpleMatch) {
    value = parseFloat(simpleMatch[1].replace(",", "."))
    unitRaw = simpleMatch[2].toLowerCase()
  } else if (majorUnit) {
    // Try to get from majorUnit (e.g., "/Lt", "/Kg")
    const unitMatch = majorUnit.replace("/", "").toLowerCase().trim()
    const normalizedUnit = UNIT_ALIASES[unitMatch]
    if (normalizedUnit) {
      return { value: 1, unit: normalizedUnit, baseValue: 1, baseUnit: normalizedUnit }
    }
    return null
  } else {
    return null
  }

  const unit = UNIT_ALIASES[unitRaw] || unitRaw
  const conversion = UNIT_TO_BASE[unit]

  if (conversion) {
    return {
      value,
      unit,
      baseValue: value * conversion.multiplier,
      baseUnit: conversion.unit,
    }
  }

  return { value, unit, baseValue: value, baseUnit: unit }
}

/**
 * Calculates how similar two sizes are (0-1)
 * Returns 1 for exact match, decreasing for larger differences
 */
function calculateSizeSimilarity(size1: NormalizedSize | null, size2: NormalizedSize | null): number {
  if (!size1 || !size2) return 0

  // Units must be compatible (same base unit)
  if (size1.baseUnit !== size2.baseUnit) return 0

  // Calculate ratio (smaller / larger)
  const ratio = Math.min(size1.baseValue, size2.baseValue) / Math.max(size1.baseValue, size2.baseValue)

  // Require at least 80% size match for any score
  if (ratio < 0.8) return 0

  return ratio
}

/**
 * Calculates word-level similarity between two product names
 * More strict than Jaccard - penalizes missing words heavily
 */
function calculateNameSimilarity(
  name1: string | null,
  name2: string | null,
): {
  similarity: number
  matchedWords: string[]
  missingWords: string[]
  extraWords: string[]
} {
  const words1 = extractWords(name1)
  const words2 = extractWords(name2)

  if (words1.length === 0 || words2.length === 0) {
    return { similarity: 0, matchedWords: [], missingWords: words1, extraWords: words2 }
  }

  const set1 = new Set(words1)
  const set2 = new Set(words2)

  const matchedWords = words1.filter((w) => set2.has(w))
  const missingWords = words1.filter((w) => !set2.has(w))
  const extraWords = words2.filter((w) => !set1.has(w))

  // Weighted similarity:
  // - Matched words contribute positively
  // - Missing words (in source but not target) penalize heavily
  // - Extra words (in target but not source) penalize slightly

  const matchScore = matchedWords.length
  const missingPenalty = missingWords.length * 1.5 // Heavy penalty
  const extraPenalty = extraWords.length * 0.3 // Light penalty

  const maxPossible = words1.length
  const score = Math.max(0, matchScore - missingPenalty - extraPenalty)
  const similarity = score / maxPossible

  return {
    similarity: Math.max(0, Math.min(1, similarity)),
    matchedWords,
    missingWords,
    extraWords,
  }
}

/**
 * Calculates price per unit similarity (0-1)
 */
function calculatePricePerUnitSimilarity(price1: number | null, price2: number | null): number {
  if (!price1 || !price2 || price1 <= 0 || price2 <= 0) return 0

  const ratio = Math.min(price1, price2) / Math.max(price1, price2)

  // Prices should be within 30% of each other
  if (ratio < 0.7) return 0

  return ratio
}

/**
 * Checks if brands match (case-insensitive, with fuzzy matching)
 * Handles cases like "Compal" vs "Compal Clássico" - one containing the other
 */
function brandsMatch(brand1: string | null, brand2: string | null): boolean {
  if (!brand1 || !brand2) return false

  const b1 = normalizeName(brand1)
  const b2 = normalizeName(brand2)

  if (!b1 || !b2) return false

  // Exact match
  if (b1 === b2) return true

  // One contains the other (handles "Compal" vs "Compal Classico")
  if (b1.includes(b2) || b2.includes(b1)) return true

  // Check if first word matches (handles "Compal Classico" vs "Compal Nectar")
  const b1FirstWord = b1.split(" ")[0]
  const b2FirstWord = b2.split(" ")[0]
  if (b1FirstWord.length >= 3 && b1FirstWord === b2FirstWord) return true

  // Levenshtein distance for typos (allow 2 char difference for short brands, 3 for longer)
  const maxDist = Math.max(b1.length, b2.length) > 8 ? 3 : 2
  if (levenshteinDistance(b1, b2) <= maxDist) return true

  return false
}

/**
 * Simple Levenshtein distance implementation
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    }
  }

  return matrix[b.length][a.length]
}

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

/**
 * Augments products with is_favorited field based on user's favorites
 */
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

/**
 * Finds identical products from different stores
 * Priority: 1) Exact barcode match  2) Fuzzy matching (brand + size + name)
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

  // Build both queries upfront and run in parallel
  const barcodeQuery =
    source.barcode
      ? supabase
          .from("store_products")
          .select("*")
          .eq("barcode", source.barcode)
          .neq("origin_id", source.origin_id)
          .neq("id", productId)
          .limit(limit)
      : null

  // Fuzzy query: exact brand + text search on name (pushes hard requirements into DB)
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

  // Augment with favorites
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

  // Get source product
  const { data: source, error } = await supabase.from("store_products").select("*").eq("id", productId).single()

  if (error || !source) {
    console.warn(`[findRelatedProducts] source product ${productId} not found`, error)
    return { data: null, error: error || "Product not found" }
  }

  const brandTrimmed = source.brand?.trim() || null

  // Get candidates: same brand from any store, or similar name
  const queries = []

  if (brandTrimmed) {
    queries.push(
      supabase.from("store_products").select("*").ilike("brand", brandTrimmed).neq("id", productId).limit(100),
    )
  }

  // Similar name products (text search)
  const words = extractWords(source.name)
  if (words.length >= 2) {
    const searchTerms = words.slice(0, 3).join(" & ")
    queries.push(
      supabase.from("store_products").select("*").textSearch("name", searchTerms).neq("id", productId).limit(100),
    )
  }

  const results = await Promise.all(queries)
  const allCandidates = new Map<number, StoreProduct>()

  for (const result of results) {
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

  // Score all candidates
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

  // Sort by score and return top matches
  matches.sort((a, b) => b.score - a.score)

  const final = matches.slice(0, limit).map((m) => ({
    ...m.product,
    similarity_score: m.score,
    similarity_factors: m.factors,
  }))

  // Augment with favorites
  const augmented = await augmentWithFavorites(supabase, final, userId)

  return { data: augmented, error: null }
}
