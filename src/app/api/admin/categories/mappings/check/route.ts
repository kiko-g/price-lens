import { categoryMappingQueries, canonicalCategoryQueries } from "@/lib/queries/canonical-categories"
import { flagMappingReasons } from "@/lib/business/mapping-quality"
import type { CanonicalCategory, StoreCategoryTuple } from "@/types"
import { NextResponse } from "next/server"

function buildIdToPath(cats: CanonicalCategory[], parentPath: string[] = []): Map<number, string> {
  const out = new Map<number, string>()
  for (const c of cats) {
    const path = [...parentPath, c.name]
    out.set(c.id, path.join(" > "))
    if (c.children?.length) {
      buildIdToPath(c.children, path).forEach((v, k) => out.set(k, v))
    }
  }
  return out
}

/**
 * GET /api/admin/categories/mappings/check
 * Dry run: flags potentially bad mappings using heuristics (word overlap, over-generalization).
 * Does not change any data.
 */
export async function GET() {
  const [tuplesRes, treeRes] = await Promise.all([
    categoryMappingQueries.getStoreTuplesWithMappingStatus({ mapped: true }),
    canonicalCategoryQueries.getTree(),
  ])

  if (tuplesRes.error) {
    return NextResponse.json({ error: tuplesRes.error.message }, { status: 500 })
  }
  if (treeRes.error || !treeRes.data) {
    return NextResponse.json({ error: treeRes.error?.message ?? "Failed to load canonical tree" }, { status: 500 })
  }

  const mappedTuples = (tuplesRes.data ?? []) as StoreCategoryTuple[]
  const idToPath = buildIdToPath(treeRes.data)
  const flagged: { tuple: StoreCategoryTuple; canonicalPath: string; reasons: string[] }[] = []

  for (const tuple of mappedTuples) {
    const canonicalId = tuple.canonical_category_id
    if (canonicalId == null) continue
    const canonicalPath = idToPath.get(canonicalId)
    if (!canonicalPath) continue
    const reasons = flagMappingReasons(tuple, canonicalPath)
    if (reasons.length > 0) {
      flagged.push({ tuple, canonicalPath, reasons })
    }
  }

  return NextResponse.json({
    totalChecked: mappedTuples.length,
    flaggedCount: flagged.length,
    flagged,
  })
}
