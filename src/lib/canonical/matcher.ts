/**
 * Canonical product matching pipeline (batch, incremental).
 *
 * Pass 1   — deterministic: barcode → trade_item  (only unlinked store_products)
 * Pass 1.5 — enrichment:    trade_item → Open Food Facts lookup (only pending)
 * Pass 2   — clustering:    trade_item → canonical_product (only unassigned)
 *
 * Every pass is incremental: it only processes records that haven't been
 * handled yet, making re-runs fast and safe for production cron.
 *
 * Accepts a Supabase service-role client so it can be called from scripts.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { parseGtin, extractInnerGtin13 } from "@/lib/gtin"
import { runBulkEnrichment, type EnrichOptions } from "@/lib/canonical/off-bulk-enrichment"
import {
  normalizeName,
  parseSize,
  calculateSizeSimilarity,
  calculateNameSimilarity,
  brandsMatch,
  type NormalizedSize,
} from "@/lib/canonical/similarity"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineOptions {
  dryRun?: boolean
  forceDownload?: boolean
  csvPath?: string
}

export interface MatcherStats {
  tradeItemsCreated: number
  tradeItemsExisting: number
  offEnriched: number
  offNotFound: number
  offErrors: number
  offSkipped: number
  canonicalsCreated: number
  canonicalsMatched: number
  storeProductsLinked: number
  storeProductsUnlinked: number
  lowConfidenceMatches: LowConfidenceMatch[]
}

export interface LowConfidenceMatch {
  tradeItemGtin: string
  candidateCanonicalId: number
  candidateCanonicalName: string
  confidence: number
  reasons: string[]
}

interface StoreProductRow {
  id: number
  barcode: string | null
  name: string
  brand: string | null
  pack: string | null
  major_unit: string | null
}

interface TradeItemRow {
  id: number
  gtin: string
  canonical_product_id: number | null
  off_product_name: string | null
}

interface CanonicalDbRow {
  id: number
  name: string
  brand: string | null
  volume_value: number | null
  volume_unit: string | null
}

interface CanonicalRow extends CanonicalDbRow {
  off_name: string | null
}

interface RepresentativeAttrs {
  brand: string | null
  name: string
  offName: string | null
  size: NormalizedSize | null
}

const CONFIDENCE_ASSIGN = 88
const CONFIDENCE_LOG = 70
const PAGE_SIZE = 1000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchAllPaginated<T>(
  queryFactory: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = []
  let offset = 0
  for (;;) {
    const { data, error } = await queryFactory(offset, offset + PAGE_SIZE - 1)
    if (error) throw new Error(`Paginated fetch failed: ${JSON.stringify(error)}`)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return all
}

function computeRepresentative(products: StoreProductRow[], offName: string | null): RepresentativeAttrs {
  const brandCounts = new Map<string, number>()
  for (const p of products) {
    if (p.brand) {
      const key = normalizeName(p.brand)
      brandCounts.set(key, (brandCounts.get(key) || 0) + 1)
    }
  }
  let bestBrand: string | null = null
  let bestBrandCount = 0
  for (const [, count] of brandCounts) {
    if (count > bestBrandCount) bestBrandCount = count
  }
  for (const p of products) {
    if (p.brand && brandCounts.get(normalizeName(p.brand)) === bestBrandCount) {
      bestBrand = p.brand
      break
    }
  }

  let bestName = products[0].name
  for (const p of products) {
    if (p.name.length > bestName.length) bestName = p.name
  }

  let size: NormalizedSize | null = null
  for (const p of products) {
    size = parseSize(p.pack, p.major_unit)
    if (size) break
  }

  return { brand: bestBrand, name: bestName, offName, size }
}

// ---------------------------------------------------------------------------
// Matching logic (v2: OFF-aware)
// ---------------------------------------------------------------------------

function scoreCanonicalMatch(
  rep: RepresentativeAttrs,
  canonical: CanonicalRow,
): { confidence: number; reasons: string[] } | null {
  const reasons: string[] = []

  if (!brandsMatch(rep.brand, canonical.brand)) return null
  reasons.push("brand_match")

  const canonicalSize: NormalizedSize | null =
    canonical.volume_value != null && canonical.volume_unit
      ? {
          value: canonical.volume_value,
          unit: canonical.volume_unit,
          baseValue: canonical.volume_value,
          baseUnit: canonical.volume_unit,
        }
      : null

  const sizeSim = calculateSizeSimilarity(rep.size, canonicalSize)
  if (rep.size && canonicalSize && sizeSim < 0.9) return null
  if (canonicalSize && (!rep.size || sizeSim < 0.9)) return null
  const hasVolumeMatch = sizeSim > 0
  if (hasVolumeMatch) {
    reasons.push(`size_${(sizeSim * 100).toFixed(0)}%`)
  }

  // Tier 1: OFF product name match
  if (rep.offName && canonical.off_name) {
    const offSim = calculateNameSimilarity(rep.offName, canonical.off_name)
    if (offSim.similarity >= 0.6) {
      reasons.push(`off_name_${(offSim.similarity * 100).toFixed(0)}%`)
      const confidence = 40 + (hasVolumeMatch ? sizeSim * 25 : 0) + offSim.similarity * 35
      return { confidence, reasons }
    }
  }

  // Tier 2: Store name similarity (strict)
  const nameResult = calculateNameSimilarity(rep.name, canonical.name)
  if (nameResult.similarity >= 0.7) {
    reasons.push(`name_${(nameResult.similarity * 100).toFixed(0)}%`)
    const confidence = 35 + (hasVolumeMatch ? sizeSim * 25 : 0) + nameResult.similarity * 35
    return { confidence, reasons }
  }

  return null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSupabaseError(error: unknown): string {
  if (error == null) return "no data returned"
  const e = error as { code?: string; message?: string; cause?: unknown; details?: string }
  let msg = [e.code ?? "?", e.message ?? String(error)].filter(Boolean).join(": ")
  if (e.details) msg += ` | details: ${e.details}`
  if (e.cause instanceof Error) {
    const c = e.cause as Error & { code?: string; errno?: number }
    msg += ` | cause: ${c.message}${c.code != null ? ` [${c.code}]` : ""}${c.errno != null ? ` errno=${c.errno}` : ""}`
  } else if (e.cause != null) {
    msg += ` | cause: ${String(e.cause)}`
  }
  return msg
}

// ---------------------------------------------------------------------------
// Pass 1: barcode → trade_item (incremental: only unlinked store_products)
// ---------------------------------------------------------------------------

export async function runPass1(
  supabase: SupabaseClient,
  log: (msg: string) => void = console.log,
  options: PipelineOptions = {},
): Promise<{ created: number; existing: number; linked: number; unlinked: number }> {
  const dryRun = options.dryRun ?? false

  log("[Pass 1] Fetching unlinked store_products with barcodes...")

  const products = await fetchAllPaginated<StoreProductRow>((from, to) =>
    supabase
      .from("store_products")
      .select("id, barcode, name, brand, pack, major_unit")
      .not("barcode", "is", null)
      .is("trade_item_id", null)
      .order("id")
      .range(from, to),
  )

  const byBarcode = new Map<string, StoreProductRow[]>()
  for (const p of products) {
    if (!p.barcode) continue
    const key = p.barcode.trim()
    if (!key) continue
    const group = byBarcode.get(key) || []
    group.push(p)
    byBarcode.set(key, group)
  }

  log(`[Pass 1] ${byBarcode.size} distinct barcodes from ${products.length} unlinked products`)

  if (byBarcode.size === 0) {
    const { count: unlinked } = await supabase
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .is("barcode", null)
    log(`[Pass 1] Nothing to do. ${unlinked ?? "?"} store_products have no barcode.`)
    return { created: 0, existing: 0, linked: 0, unlinked: unlinked ?? 0 }
  }

  if (dryRun) {
    log(`[Pass 1] [DRY RUN] Would upsert ${byBarcode.size} trade_items and link ${products.length} store_products`)
    return { created: byBarcode.size, existing: 0, linked: products.length, unlinked: 0 }
  }

  const gtinToTradeItemId = new Map<string, number>()
  const UPSERT_BATCH = 500
  const allBarcodes = [...byBarcode.keys()]

  // Also collect inner GTIN-13s for GTIN-14 barcodes
  const extraBarcodes: string[] = []
  for (const barcode of allBarcodes) {
    const inner13 = extractInnerGtin13(barcode)
    if (inner13 && !byBarcode.has(inner13)) extraBarcodes.push(inner13)
  }
  const allToUpsert = [...new Set([...allBarcodes, ...extraBarcodes])]

  log(`[Pass 1] Upserting ${allToUpsert.length} trade_items in batches of ${UPSERT_BATCH}...`)
  let upserted = 0
  let failedBarcodes = 0
  let lastUpsertPct = -1

  for (let i = 0; i < allToUpsert.length; i += UPSERT_BATCH) {
    const batch = allToUpsert.slice(i, i + UPSERT_BATCH)
    const rows = batch.map((b) => {
      const parsed = parseGtin(b)
      return { gtin: b, gtin_format: parsed?.format ?? "ean13", gs1_prefix: parsed?.gs1Prefix ?? null }
    })

    const { data, error } = await supabase.from("trade_items").upsert(rows, { onConflict: "gtin" }).select("id, gtin")

    if (error) {
      log(`[Pass 1] WARN: batch upsert failed at offset ${i}: ${formatSupabaseError(error)}`)
      failedBarcodes += batch.length
    } else if (data) {
      for (const row of data) gtinToTradeItemId.set(row.gtin, row.id)
      upserted += data.length
    }

    const pct = Math.floor(((i + batch.length) / allToUpsert.length) * 100)
    if (pct % 5 === 0 && pct !== lastUpsertPct) {
      lastUpsertPct = pct
      log(`[Pass 1] Upsert progress: ${pct}% (${i + batch.length}/${allToUpsert.length})`)
    }
  }

  if (failedBarcodes > 0) {
    log(`[Pass 1] WARN: ${failedBarcodes} barcodes failed upsert`)
  }

  const created = upserted
  const existing = byBarcode.size - created
  log(`[Pass 1] Trade items upserted: ${created}, already existed: ${existing < 0 ? 0 : existing}`)

  // Linking: batch store_products updates
  const LINK_BATCH = 500
  let linked = 0
  let linkBatchNum = 0
  let lastLinkPct = -1
  const barcodeEntries = [...byBarcode.entries()]

  // Build batched update groups: each group maps trade_item_id → store_product_ids
  type LinkOp = { tiId: number; spIds: number[] }
  const linkOps: LinkOp[] = []
  for (const [barcode, prods] of barcodeEntries) {
    const tiId = gtinToTradeItemId.get(barcode)
    if (!tiId) continue
    linkOps.push({ tiId, spIds: prods.map((p) => p.id) })
  }

  log(`[Pass 1] Linking ${products.length} store_products via ${linkOps.length} barcode groups...`)

  for (let i = 0; i < linkOps.length; i += LINK_BATCH) {
    const batch = linkOps.slice(i, i + LINK_BATCH)
    const results = await Promise.all(
      batch.map((op) => supabase.from("store_products").update({ trade_item_id: op.tiId }).in("id", op.spIds)),
    )

    for (let j = 0; j < results.length; j++) {
      if (results[j].error) {
        log(`[Pass 1] WARN: linking failed for a barcode group`)
      } else {
        linked += batch[j].spIds.length
      }
    }

    linkBatchNum += batch.length
    const pct = Math.floor((linkBatchNum / linkOps.length) * 100)
    if (pct % 5 === 0 && pct !== lastLinkPct) {
      lastLinkPct = pct
      log(`[Pass 1] Linking progress: ${pct}% (${linked} store_products linked)`)
    }
  }

  const { count: unlinked } = await supabase
    .from("store_products")
    .select("id", { count: "exact", head: true })
    .is("barcode", null)

  log(`[Pass 1] Linked ${linked} store_products. ${unlinked ?? "?"} remain unlinked (no barcode).`)

  return { created, existing: existing < 0 ? 0 : existing, linked, unlinked: unlinked ?? 0 }
}

// ---------------------------------------------------------------------------
// Pass 1.5: enrich trade_items with Open Food Facts (bulk CSV dump)
// ---------------------------------------------------------------------------

export async function runEnrichment(
  supabase: SupabaseClient,
  log: (msg: string) => void = console.log,
  options: PipelineOptions = {},
): Promise<{ enriched: number; notFound: number; errors: number; skipped: number }> {
  const enrichOpts: EnrichOptions = {
    csvPath: options.csvPath,
    forceDownload: options.forceDownload,
    dryRun: options.dryRun,
  }
  const result = await runBulkEnrichment(supabase, log, enrichOpts)
  return { enriched: result.enriched, notFound: result.notFound, errors: 0, skipped: result.skipped }
}

// ---------------------------------------------------------------------------
// Pass 2: trade_item → canonical_product (OFF-aware, incremental)
// ---------------------------------------------------------------------------

export async function runPass2(
  supabase: SupabaseClient,
  log: (msg: string) => void = console.log,
  options: PipelineOptions = {},
): Promise<{
  canonicalsCreated: number
  canonicalsMatched: number
  lowConfidenceMatches: LowConfidenceMatch[]
}> {
  const dryRun = options.dryRun ?? false

  log("[Pass 2] Fetching unassigned trade_items...")

  const unassigned = await fetchAllPaginated<TradeItemRow>((from, to) =>
    supabase
      .from("trade_items")
      .select("id, gtin, canonical_product_id, off_product_name")
      .is("canonical_product_id", null)
      .order("id")
      .range(from, to),
  )

  log(`[Pass 2] ${unassigned.length} trade_items need canonical assignment`)

  if (unassigned.length === 0) {
    await denormalizeCanonicalIds(supabase, log, dryRun)
    return { canonicalsCreated: 0, canonicalsMatched: 0, lowConfidenceMatches: [] }
  }

  // Pre-load existing canonicals with their OFF name
  const allCanonicals = await fetchAllPaginated<CanonicalDbRow>((from, to) =>
    supabase
      .from("canonical_products")
      .select("id, name, brand, volume_value, volume_unit")
      .order("id")
      .range(from, to),
  )

  const canonicalOffNames = new Map<number, string>()
  if (allCanonicals.length > 0) {
    const assignedTis = await fetchAllPaginated<{ canonical_product_id: number; off_product_name: string | null }>(
      (from, to) =>
        supabase
          .from("trade_items")
          .select("canonical_product_id, off_product_name")
          .not("canonical_product_id", "is", null)
          .not("off_product_name", "is", null)
          .order("id")
          .range(from, to),
    )
    for (const ti of assignedTis) {
      if (ti.off_product_name && !canonicalOffNames.has(ti.canonical_product_id)) {
        canonicalOffNames.set(ti.canonical_product_id, ti.off_product_name)
      }
    }
  }

  const canonicalsWithOff: CanonicalRow[] = allCanonicals.map((c) => ({
    ...c,
    off_name: canonicalOffNames.get(c.id) ?? null,
  }))

  const canonicalsByBrand = new Map<string, CanonicalRow[]>()
  for (const c of canonicalsWithOff) {
    const key = normalizeName(c.brand)
    const group = canonicalsByBrand.get(key) || []
    group.push(c)
    canonicalsByBrand.set(key, group)
  }

  log(`[Pass 2] ${allCanonicals.length} existing canonicals loaded (${canonicalOffNames.size} with OFF names)`)

  // Pre-load ALL store_products for unassigned trade_items (bulk, eliminates per-item fetches)
  log("[Pass 2] Pre-loading store_products for all unassigned trade_items...")
  const spByTradeItemId = new Map<number, StoreProductRow[]>()
  const allStoreProds = await fetchAllPaginated<StoreProductRow & { trade_item_id: number }>((from, to) =>
    supabase
      .from("store_products")
      .select("id, barcode, name, brand, pack, major_unit, trade_item_id")
      .not("trade_item_id", "is", null)
      .order("id")
      .range(from, to),
  )
  for (const sp of allStoreProds) {
    const group = spByTradeItemId.get(sp.trade_item_id) || []
    group.push(sp)
    spByTradeItemId.set(sp.trade_item_id, group)
  }
  log(`[Pass 2] Pre-loaded ${allStoreProds.length} store_products for ${spByTradeItemId.size} trade_items`)

  let canonicalsMatched = 0
  const lowConfidenceMatches: LowConfidenceMatch[] = []

  // GTIN-14 → inner GTIN-13 pre-linking using ASSIGNED trade_items from DB
  log("[Pass 2] Pre-linking GTIN-14 → inner GTIN-13...")
  const gtinToCanonical = new Map<string, number>()
  const assignedGtinLookup = new Map<string, number>()
  if (allCanonicals.length > 0) {
    const assignedGtins = await fetchAllPaginated<{ gtin: string; canonical_product_id: number }>((from, to) =>
      supabase
        .from("trade_items")
        .select("gtin, canonical_product_id")
        .not("canonical_product_id", "is", null)
        .order("id")
        .range(from, to),
    )
    for (const ti of assignedGtins) {
      assignedGtinLookup.set(ti.gtin, ti.canonical_product_id)
    }
  }
  let gtin14Linked = 0
  for (const ti of unassigned) {
    const inner = extractInnerGtin13(ti.gtin)
    if (!inner) continue
    const innerCanonical = assignedGtinLookup.get(inner)
    if (innerCanonical) {
      gtinToCanonical.set(ti.gtin, innerCanonical)
      gtin14Linked++
    }
  }
  log(`[Pass 2] GTIN-14 pre-link done: ${gtin14Linked} linked`)

  // Virtual canonical tracking for single-run clustering.
  // During the loop, unmatched trade_items create virtual canonicals (negative IDs)
  // that subsequent trade_items can match against.
  let nextVirtualId = -1
  type VirtualCanonical = { virtualId: number; offName: string | null; rep: RepresentativeAttrs; tiIds: number[] }
  const virtualById = new Map<number, VirtualCanonical>()

  type PendingLink = { tiId: number; canonicalId: number }
  const pendingLinks: PendingLink[] = []

  log(`[Pass 2] Processing ${unassigned.length} trade_items...`)
  let processed = 0
  let lastLoggedPct2 = -1

  for (const ti of unassigned) {
    processed++
    const pct = Math.floor((processed / unassigned.length) * 100)
    if (pct % 5 === 0 && pct !== lastLoggedPct2) {
      lastLoggedPct2 = pct
      log(
        `[Pass 2] Matching: ${pct}% (${processed}/${unassigned.length}) — ${virtualById.size} to create, ${canonicalsMatched} matched`,
      )
    }

    // Pre-linked GTIN-14 hierarchy
    const preLinked = gtinToCanonical.get(ti.gtin)
    if (preLinked) {
      pendingLinks.push({ tiId: ti.id, canonicalId: preLinked })
      canonicalsMatched++
      continue
    }

    const storeProds = spByTradeItemId.get(ti.id)?.slice(0, 20)
    if (!storeProds || storeProds.length === 0) continue

    const rep = computeRepresentative(storeProds as StoreProductRow[], ti.off_product_name)

    // Score against same-brand canonicals (includes both DB-loaded and virtual)
    const brandKey = normalizeName(rep.brand)
    const candidates = canonicalsByBrand.get(brandKey) || []

    let bestMatch: { canonical: CanonicalRow; confidence: number; reasons: string[] } | null = null
    for (const candidate of candidates) {
      const result = scoreCanonicalMatch(rep, candidate)
      if (!result) continue
      if (!bestMatch || result.confidence > bestMatch.confidence) {
        bestMatch = { canonical: candidate, ...result }
      }
    }

    if (bestMatch && bestMatch.confidence >= CONFIDENCE_ASSIGN) {
      const matchedId = bestMatch.canonical.id
      if (matchedId < 0) {
        // Matched a virtual canonical — add to its group
        virtualById.get(matchedId)!.tiIds.push(ti.id)
      } else {
        pendingLinks.push({ tiId: ti.id, canonicalId: matchedId })
      }
      if (ti.off_product_name && !canonicalOffNames.has(matchedId)) {
        canonicalOffNames.set(matchedId, ti.off_product_name)
        bestMatch.canonical.off_name = ti.off_product_name
      }
      canonicalsMatched++
    } else {
      if (bestMatch && bestMatch.confidence >= CONFIDENCE_LOG) {
        lowConfidenceMatches.push({
          tradeItemGtin: ti.gtin,
          candidateCanonicalId: bestMatch.canonical.id,
          candidateCanonicalName: bestMatch.canonical.name,
          confidence: bestMatch.confidence,
          reasons: bestMatch.reasons,
        })
      }

      // Create a virtual canonical and add it to the brand index
      // so subsequent trade_items in this run can match against it
      const virtualId = nextVirtualId--
      const virtualRow: CanonicalRow = {
        id: virtualId,
        name: rep.offName || rep.name,
        brand: rep.brand,
        volume_value: rep.size?.baseValue ?? null,
        volume_unit: rep.size?.baseUnit ?? null,
        off_name: ti.off_product_name,
      }
      addToIndex(canonicalsByBrand, virtualRow)
      virtualById.set(virtualId, { virtualId, offName: ti.off_product_name, rep, tiIds: [ti.id] })
    }
  }

  log(`[Pass 2] Matching complete: ${canonicalsMatched} matched, ${virtualById.size} new canonicals to create`)

  const allVirtuals = [...virtualById.values()]
  let canonicalsCreated = 0

  if (!dryRun) {
    const BATCH = 500
    let createdSoFar = 0
    let lastCreatePct = -1

    for (let i = 0; i < allVirtuals.length; i += BATCH) {
      const batch = allVirtuals.slice(i, i + BATCH)
      const rows = batch.map((vc) => ({
        name: vc.rep.offName || vc.rep.name,
        brand: vc.rep.brand,
        volume_value: vc.rep.size?.baseValue ?? null,
        volume_unit: vc.rep.size?.baseUnit ?? null,
        source: "auto" as const,
      }))

      const { data, error } = await supabase.from("canonical_products").insert(rows).select("id")

      if (error) {
        log(`[Pass 2] WARN: batch insert canonicals failed at offset ${i}: ${formatSupabaseError(error)}`)
        continue
      }

      if (data) {
        for (let j = 0; j < data.length; j++) {
          const realId = data[j].id
          const vc = batch[j]
          for (const tiId of vc.tiIds) {
            pendingLinks.push({ tiId, canonicalId: realId })
          }
          canonicalsCreated++
        }
      }

      createdSoFar += batch.length
      const pct = Math.floor((createdSoFar / allVirtuals.length) * 100)
      if (pct % 5 === 0 && pct !== lastCreatePct) {
        lastCreatePct = pct
        log(`[Pass 2] Create progress: ${pct}% (${createdSoFar}/${allVirtuals.length})`)
      }
    }

    log(`[Pass 2] Created ${canonicalsCreated} canonical_products. Linking ${pendingLinks.length} trade_items...`)

    let linkedSoFar = 0
    let lastLinkPct = -1

    for (let i = 0; i < pendingLinks.length; i += BATCH) {
      const batch = pendingLinks.slice(i, i + BATCH)
      const tiIds = batch.map((l) => l.tiId)
      const cpIds = batch.map((l) => l.canonicalId)

      const { data: affected, error: linkErr } = await supabase.rpc("bulk_link_trade_items", {
        ti_ids: tiIds,
        cp_ids: cpIds,
      })

      if (linkErr) {
        log(`[Pass 2] WARN: bulk link batch ${i}-${i + batch.length} failed: ${linkErr.message}`)
      } else if (affected !== batch.length) {
        log(`[Pass 2] WARN: bulk link expected ${batch.length} rows, got ${affected}`)
      }

      linkedSoFar += batch.length
      const pct = Math.floor((linkedSoFar / pendingLinks.length) * 100)
      if (pct % 5 === 0 && pct !== lastLinkPct) {
        lastLinkPct = pct
        log(`[Pass 2] Linking progress: ${pct}% (${linkedSoFar}/${pendingLinks.length})`)
      }
    }
  } else {
    canonicalsCreated = allVirtuals.length
  }

  // Denormalize canonical_product_id onto store_products
  await denormalizeCanonicalIds(supabase, log, dryRun)

  log(`[Pass 2] Created ${canonicalsCreated} new canonical_products, matched ${canonicalsMatched} to existing.`)
  if (lowConfidenceMatches.length > 0) {
    log(`[Pass 2] ${lowConfidenceMatches.length} low-confidence matches logged for review.`)
  }

  return { canonicalsCreated, canonicalsMatched, lowConfidenceMatches }
}

// ---------------------------------------------------------------------------
// Denormalization via batched SQL function (REST-API safe)
// ---------------------------------------------------------------------------

async function denormalizeCanonicalIds(
  supabase: SupabaseClient,
  log: (msg: string) => void,
  dryRun: boolean,
): Promise<number> {
  log("[Denormalize] Propagating canonical_product_id from trade_items → store_products...")

  if (dryRun) {
    const { count } = await supabase
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .not("trade_item_id", "is", null)
      .is("canonical_product_id", null)
    log(`[Denormalize] [DRY RUN] At least ${count ?? "?"} store_products need updating`)
    return count ?? 0
  }

  let totalUpdated = 0
  let batchSize = 2000
  let consecutiveErrors = 0

  for (;;) {
    const { data, error } = await supabase.rpc("denormalize_canonical_ids_batch", {
      batch_size: batchSize,
    })

    if (error) {
      consecutiveErrors++
      if (consecutiveErrors >= 3) {
        log(`[Denormalize] ERROR: 3 consecutive failures at ${totalUpdated} rows: ${error.message}`)
        return totalUpdated
      }
      batchSize = Math.max(200, Math.floor(batchSize / 2))
      log(`[Denormalize] WARN: batch failed, reducing to ${batchSize}: ${error.message}`)
      continue
    }

    consecutiveErrors = 0
    const updated = typeof data === "number" ? data : 0
    if (updated === 0) break

    totalUpdated += updated
    log(`[Denormalize] Progress: ${totalUpdated} store_products updated...`)
  }

  log(`[Denormalize] Done. Updated ${totalUpdated} store_products.`)
  return totalUpdated
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function addToIndex(index: Map<string, CanonicalRow[]>, canonical: CanonicalRow): void {
  const key = normalizeName(canonical.brand)
  const group = index.get(key) || []
  group.push(canonical)
  index.set(key, group)
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface TableCounts {
  storeProducts: number
  storeProductsWithBarcode: number
  storeProductsLinked: number
  tradeItems: number
  tradeItemsEnriched: number
  tradeItemsAssigned: number
  canonicalProducts: number
}

export async function getTableCounts(supabase: SupabaseClient): Promise<TableCounts> {
  const [sp, spBarcode, spLinked, ti, tiEnriched, tiAssigned, cp] = await Promise.all([
    supabase.from("store_products").select("id", { count: "exact", head: true }),
    supabase.from("store_products").select("id", { count: "exact", head: true }).not("barcode", "is", null),
    supabase.from("store_products").select("id", { count: "exact", head: true }).not("trade_item_id", "is", null),
    supabase.from("trade_items").select("id", { count: "exact", head: true }),
    supabase
      .from("trade_items")
      .select("id", { count: "exact", head: true })
      .not("off_product_name", "is", null)
      .neq("off_product_name", ""),
    supabase.from("trade_items").select("id", { count: "exact", head: true }).not("canonical_product_id", "is", null),
    supabase.from("canonical_products").select("id", { count: "exact", head: true }),
  ])

  return {
    storeProducts: sp.count ?? 0,
    storeProductsWithBarcode: spBarcode.count ?? 0,
    storeProductsLinked: spLinked.count ?? 0,
    tradeItems: ti.count ?? 0,
    tradeItemsEnriched: tiEnriched.count ?? 0,
    tradeItemsAssigned: tiAssigned.count ?? 0,
    canonicalProducts: cp.count ?? 0,
  }
}

export function logCounts(counts: TableCounts, log: (msg: string) => void): void {
  log(
    `  store_products:   ${counts.storeProducts} total, ${counts.storeProductsWithBarcode} with barcode, ${counts.storeProductsLinked} linked to trade_item`,
  )
  log(
    `  trade_items:      ${counts.tradeItems} total, ${counts.tradeItemsEnriched} OFF-enriched, ${counts.tradeItemsAssigned} assigned to canonical`,
  )
  log(`  canonical_products: ${counts.canonicalProducts} total`)
}

// ---------------------------------------------------------------------------
// Integrity verification
// ---------------------------------------------------------------------------

export interface IntegrityResult {
  passed: boolean
  checks: { name: string; expected: string; actual: string; ok: boolean }[]
}

export async function verifyIntegrity(supabase: SupabaseClient, log: (msg: string) => void): Promise<IntegrityResult> {
  log("[Verify] Running integrity checks...")

  const [tiLinked, cpTotal, spWithTi, spDenormed, orphanedCp] = await Promise.all([
    supabase.from("trade_items").select("id", { count: "exact", head: true }).not("canonical_product_id", "is", null),
    supabase.from("canonical_products").select("id", { count: "exact", head: true }),
    supabase.from("store_products").select("id", { count: "exact", head: true }).not("trade_item_id", "is", null),
    supabase
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .not("trade_item_id", "is", null)
      .not("canonical_product_id", "is", null),
    supabase.rpc("count_orphaned_canonicals"),
  ])

  const tiLinkedCount = tiLinked.count ?? 0
  const cpCount = cpTotal.count ?? 0
  const spWithTiCount = spWithTi.count ?? 0
  const spDenormedCount = spDenormed.count ?? 0
  const orphanedCount = typeof orphanedCp.data === "number" ? orphanedCp.data : -1

  const checks = [
    {
      name: "All linked trade_items point to existing canonicals",
      expected: `trade_items linked (${tiLinkedCount}) >= canonical_products (${cpCount})`,
      actual: `${tiLinkedCount} >= ${cpCount}`,
      ok: tiLinkedCount >= cpCount,
    },
    {
      name: "All store_products with trade_item_id are denormalized",
      expected: `denormalized (${spDenormedCount}) == with trade_item (${spWithTiCount})`,
      actual: `${spDenormedCount} == ${spWithTiCount}`,
      ok: spDenormedCount === spWithTiCount,
    },
    {
      name: "No orphaned canonical_products (no trade_items pointing to them)",
      expected: "0 orphaned",
      actual: orphanedCount >= 0 ? `${orphanedCount} orphaned` : "RPC unavailable (skipped)",
      ok: orphanedCount === 0 || orphanedCount < 0,
    },
  ]

  const passed = checks.every((c) => c.ok)

  for (const c of checks) {
    log(`[Verify] ${c.ok ? "PASS" : "FAIL"}: ${c.name}`)
    if (!c.ok) log(`[Verify]   Expected: ${c.expected}`)
    log(`[Verify]   Actual: ${c.actual}`)
  }

  log(`[Verify] ${passed ? "All checks passed." : "SOME CHECKS FAILED."}`)
  return { passed, checks }
}

// ---------------------------------------------------------------------------
// Full pipeline
// ---------------------------------------------------------------------------

export async function runFullPipeline(
  supabase: SupabaseClient,
  log: (msg: string) => void = console.log,
  options: PipelineOptions = {},
): Promise<MatcherStats> {
  log("=== Canonical Product Matching Pipeline ===\n")

  log("--- Before ---")
  const before = await getTableCounts(supabase)
  logCounts(before, log)
  log("")

  const pass1 = await runPass1(supabase, log, options)
  log("")
  const enrichment = await runEnrichment(supabase, log, options)
  log("")
  const pass2 = await runPass2(supabase, log, options)

  const stats: MatcherStats = {
    tradeItemsCreated: pass1.created,
    tradeItemsExisting: pass1.existing,
    offEnriched: enrichment.enriched,
    offNotFound: enrichment.notFound,
    offErrors: enrichment.errors,
    offSkipped: enrichment.skipped,
    canonicalsCreated: pass2.canonicalsCreated,
    canonicalsMatched: pass2.canonicalsMatched,
    storeProductsLinked: pass1.linked,
    storeProductsUnlinked: pass1.unlinked,
    lowConfidenceMatches: pass2.lowConfidenceMatches,
  }

  log("\n--- After ---")
  const after = await getTableCounts(supabase)
  logCounts(after, log)

  log("\n=== Pipeline Complete ===")
  log(`Trade items:  ${stats.tradeItemsCreated} upserted`)
  log(
    `OFF enriched: ${stats.offEnriched} found, ${stats.offNotFound} not in OFF, ${stats.offErrors} errors, ${stats.offSkipped} skipped (non-food)`,
  )
  log(`Canonicals:   ${stats.canonicalsCreated} created, ${stats.canonicalsMatched} matched`)
  log(`Store links:  ${stats.storeProductsLinked} linked, ${stats.storeProductsUnlinked} unlinked`)
  if (stats.lowConfidenceMatches.length > 0) {
    log(`Low-conf:     ${stats.lowConfidenceMatches.length} matches need review`)
  }

  return stats
}
