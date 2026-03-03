/**
 * Shared product similarity utilities.
 *
 * Used by both the real-time matching API (product-matching.ts) and
 * the batch canonical-product pipeline (matcher.ts).
 */

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

const UNIT_TO_BASE: Record<string, { unit: string; multiplier: number }> = {
  l: { unit: "ml", multiplier: 1000 },
  ml: { unit: "ml", multiplier: 1 },
  cl: { unit: "ml", multiplier: 10 },
  kg: { unit: "g", multiplier: 1000 },
  g: { unit: "g", multiplier: 1 },
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NormalizedSize {
  value: number
  unit: string
  baseValue: number
  baseUnit: string
}

export interface NameSimilarityResult {
  similarity: number
  matchedWords: string[]
  missingWords: string[]
  extraWords: string[]
}

// ---------------------------------------------------------------------------
// Name helpers
// ---------------------------------------------------------------------------

export function normalizeName(name: string | null): string {
  if (!name) return ""
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function extractWords(name: string | null): string[] {
  if (!name) return []
  const normalized = normalizeName(name)
  return normalized.split(" ").filter((word) => word.length > 1 && !STOP_WORDS.has(word))
}

// ---------------------------------------------------------------------------
// Size / volume helpers
// ---------------------------------------------------------------------------

/**
 * Parses a pack/size string into normalized components.
 * Examples: "1 L", "500ml", "1.5 Kg", "6x330ml"
 */
export function parseSize(pack: string | null, majorUnit: string | null): NormalizedSize | null {
  if (!pack && !majorUnit) return null

  const input = (pack || "").toLowerCase().trim()

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
 * Returns 0–1 indicating how similar two sizes are.
 * 1 = exact match, 0 = incompatible units or >20 % difference.
 */
export function calculateSizeSimilarity(size1: NormalizedSize | null, size2: NormalizedSize | null): number {
  if (!size1 || !size2) return 0
  if (size1.baseUnit !== size2.baseUnit) return 0

  const ratio = Math.min(size1.baseValue, size2.baseValue) / Math.max(size1.baseValue, size2.baseValue)
  if (ratio < 0.8) return 0

  return ratio
}

// ---------------------------------------------------------------------------
// Name similarity
// ---------------------------------------------------------------------------

/**
 * Word-level name similarity (stricter than Jaccard).
 *
 * Key behaviors:
 * - Missing words penalised heavily, extra words lightly.
 * - **Variant detection**: when names share most words but differ by
 *   1-2 substituted words (e.g. "wholenut" vs "caramel"), the score is
 *   heavily penalised to avoid grouping product variants as identical.
 */
export function calculateNameSimilarity(name1: string | null, name2: string | null): NameSimilarityResult {
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

  const overlapRatio = matchedWords.length / Math.max(words1.length, words2.length)
  const substitutedCount = Math.min(missingWords.length, extraWords.length)
  const isLikelyVariant = substitutedCount > 0 && substitutedCount <= 3 && overlapRatio >= 0.6

  const matchScore = matchedWords.length
  const missingPenalty = missingWords.length * 1.5
  const extraPenalty = extraWords.length * 0.3
  const variantPenalty = isLikelyVariant ? substitutedCount * 5 : 0

  const maxPossible = words1.length
  const score = Math.max(0, matchScore - missingPenalty - extraPenalty - variantPenalty)
  const similarity = score / maxPossible

  return {
    similarity: Math.max(0, Math.min(1, similarity)),
    matchedWords,
    missingWords,
    extraWords,
  }
}

// ---------------------------------------------------------------------------
// Price similarity
// ---------------------------------------------------------------------------

export function calculatePricePerUnitSimilarity(price1: number | null, price2: number | null): number {
  if (!price1 || !price2 || price1 <= 0 || price2 <= 0) return 0

  const ratio = Math.min(price1, price2) / Math.max(price1, price2)
  if (ratio < 0.7) return 0

  return ratio
}

// ---------------------------------------------------------------------------
// Brand matching
// ---------------------------------------------------------------------------

export function levenshteinDistance(a: string, b: string): number {
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
 * Fuzzy brand matching: exact, substring, first-word, or Levenshtein.
 */
export function brandsMatch(brand1: string | null, brand2: string | null): boolean {
  if (!brand1 || !brand2) return false

  const b1 = normalizeName(brand1)
  const b2 = normalizeName(brand2)

  if (!b1 || !b2) return false

  if (b1 === b2) return true

  if (b1.includes(b2) || b2.includes(b1)) return true

  const b1FirstWord = b1.split(" ")[0]
  const b2FirstWord = b2.split(" ")[0]
  if (b1FirstWord.length >= 3 && b1FirstWord === b2FirstWord) return true

  const maxDist = Math.max(b1.length, b2.length) > 8 ? 3 : 2
  if (levenshteinDistance(b1, b2) <= maxDist) return true

  return false
}
