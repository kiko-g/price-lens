import type { StoreCategoryTuple } from "@/types"

function normalizeWords(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
  return new Set(normalized.split(/[\s>]+/).filter((w) => w.length > 1))
}

function getStorePath(tuple: StoreCategoryTuple): string {
  const parts = [
    tuple.store_category,
    tuple.store_category_2,
    tuple.store_category_3,
  ].filter(Boolean) as string[]
  return parts.join(" > ")
}

/**
 * Heuristics to flag potentially bad store → canonical category mappings.
 * Returns an array of reason codes; empty means no issues flagged.
 */
export function flagMappingReasons(
  tuple: StoreCategoryTuple,
  canonicalPath: string,
): string[] {
  const reasons: string[] = []
  const storePath = getStorePath(tuple)
  const storeWords = normalizeWords(storePath)
  const canonicalWords = normalizeWords(canonicalPath)

  if (storeWords.size === 0) return reasons

  const overlap = [...storeWords].filter((w) => canonicalWords.has(w)).length
  const overlapRatio = overlap / storeWords.size
  if (overlapRatio === 0) {
    reasons.push("No word overlap with canonical")
  } else if (overlapRatio < 0.25) {
    reasons.push("Low word overlap with canonical")
  }

  const storeLevels = [tuple.store_category, tuple.store_category_2, tuple.store_category_3].filter(
    Boolean,
  ).length
  const canonicalLevels = canonicalPath.split(">").map((s) => s.trim()).filter(Boolean).length
  if (storeLevels >= 2 && canonicalLevels === 1) {
    reasons.push("Store category more specific than canonical (possible over-generalization)")
  }

  return reasons
}
