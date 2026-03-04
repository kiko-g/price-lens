"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { STORE_NAMES, STORE_COLORS, STORE_COLORS_SECONDARY } from "@/types/business"

import { LinkBarcodeDialog } from "@/components/admin/LinkBarcodeDialog"
import { LinkToCanonicalDialog } from "@/components/admin/LinkToCanonicalDialog"

import {
  SearchIcon,
  Loader2,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  LinkIcon,
  UnlinkIcon,
} from "lucide-react"

// ─── Shared types ───────────────────────────────────────────────────

interface StoreProductInfo {
  id: number
  origin_id: number
  name: string
  brand: string | null
  barcode: string | null
  price: number | null
  image: string | null
  url: string | null
}

interface TradeItemInfo {
  id: number
  gtin: string
  off_product_name: string | null
}

interface CanonicalMatch {
  canonicalId: number
  name: string
  brand: string | null
  barcodeCount: number
  storeCount: number
  tradeItems: TradeItemInfo[]
  storeProducts: StoreProductInfo[]
}

interface OrphanItem {
  tradeItemId: number
  gtin: string
  offProductName: string | null
  gs1Prefix: string | null
  canonicalId: number | null
  canonicalName: string | null
  brand: string | null
  storeProducts: StoreProductInfo[]
}

type View = "matches" | "orphans"

// ─── Main component ─────────────────────────────────────────────────

export function CanonicalMatchReview() {
  const [view, setView] = useState<View>("matches")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Matches state
  const [matches, setMatches] = useState<CanonicalMatch[]>([])
  const [minStores, setMinStores] = useState(2)

  // Orphans state
  const [orphans, setOrphans] = useState<OrphanItem[]>([])

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (view === "matches") {
        const params = new URLSearchParams({
          page: String(page),
          minStores: String(minStores),
        })
        if (search) params.set("search", search)
        const res = await fetch(`/api/admin/canonical-matches?${params}`)
        const json = await res.json()
        setMatches(json.data ?? [])
        setTotal(json.total ?? 0)
      } else {
        const params = new URLSearchParams({
          view: "orphans",
          page: String(page),
        })
        if (search) params.set("search", search)
        const res = await fetch(`/api/admin/canonical-matches?${params}`)
        const json = await res.json()
        setOrphans(json.data ?? [])
        setTotal(json.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [view, page, search, minStores])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const switchView = (v: View) => {
    setView(v)
    setPage(1)
    setSearch("")
  }

  return (
    <div className="flex flex-col gap-6 overflow-auto p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Canonical Matches</h1>
        <p className="text-muted-foreground text-sm">
          {view === "matches"
            ? "Review cross-barcode product groupings. Each card shows a canonical product linked to multiple barcodes across different stores."
            : "Orphan trade items with no canonical product assigned. Link them to existing canonicals."}
        </p>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          variant={view === "matches" ? "default" : "outline"}
          size="sm"
          onClick={() => switchView("matches")}
          className="gap-1.5"
        >
          <LinkIcon className="size-3.5" />
          Matches
        </Button>
        <Button
          variant={view === "orphans" ? "default" : "outline"}
          size="sm"
          onClick={() => switchView("orphans")}
          className="gap-1.5"
        >
          <UnlinkIcon className="size-3.5" />
          Orphans
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {view === "matches" && (
          <div className="flex gap-2">
            {[2, 3].map((n) => (
              <Button
                key={n}
                variant={minStores === n ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMinStores(n)
                  setPage(1)
                }}
              >
                {n === 2 ? "2+ Stores" : "All 3 Stores"}
              </Button>
            ))}
          </div>
        )}
        {view === "orphans" && <div />}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Search barcode, product name, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
        </form>
      </div>

      {/* Summary */}
      {!loading && (
        <p className="text-muted-foreground text-sm">
          {view === "matches"
            ? `${total} canonical product${total !== 1 ? "s" : ""} matched across ${minStores}+ stores`
            : `${total} single-barcode canonical${total !== 1 ? "s" : ""} — candidates for re-linking`}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : view === "matches" ? (
        matches.length === 0 ? (
          <div className="text-muted-foreground flex min-h-[30vh] items-center justify-center text-sm">
            No matches found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((match) => (
              <MatchCard key={match.canonicalId} match={match} onRefresh={fetchData} />
            ))}
          </div>
        )
      ) : orphans.length === 0 ? (
        <div className="text-muted-foreground flex min-h-[30vh] items-center justify-center text-sm">
          No single-barcode items found.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orphans.map((orphan) => (
            <OrphanCard key={orphan.tradeItemId} orphan={orphan} onRefresh={fetchData} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Match card ─────────────────────────────────────────────────────

function MatchCard({ match, onRefresh }: { match: CanonicalMatch; onRefresh: () => void }) {
  const byStore = new Map<number, StoreProductInfo[]>()
  for (const sp of match.storeProducts) {
    const group = byStore.get(sp.origin_id) || []
    group.push(sp)
    byStore.set(sp.origin_id, group)
  }

  const storeIds = [...byStore.keys()].sort()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkIcon className="size-4 shrink-0" />
              <span className="truncate">{match.name}</span>
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {match.brand && (
                <Badge variant="secondary" className="text-xs">
                  {match.brand}
                </Badge>
              )}
              <span className="text-muted-foreground text-xs">
                {match.barcodeCount} barcodes · {match.storeCount} stores
              </span>
              <span className="text-muted-foreground text-xs">· canonical #{match.canonicalId}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <LinkBarcodeDialog canonicalId={match.canonicalId} canonicalName={match.name} onLinked={onRefresh} />
            <div className="flex gap-1">
              {storeIds.map((sid) => (
                <StoreBadge key={sid} originId={sid} />
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">Barcodes</p>
          <div className="flex flex-wrap gap-2">
            {match.tradeItems.map((ti) => (
              <div key={ti.id} className="rounded-md border px-2 py-1 text-xs">
                <span className="font-mono">{ti.gtin}</span>
                {ti.off_product_name && <span className="text-muted-foreground ml-2">({ti.off_product_name})</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {storeIds.map((sid) => {
            const products = byStore.get(sid) || []
            return (
              <div key={sid} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: STORE_COLORS[sid] }} />
                  <span className="text-sm font-medium">{STORE_NAMES[sid] ?? `Store ${sid}`}</span>
                  <span className="text-muted-foreground text-xs">({products.length})</span>
                </div>
                <div className="flex flex-col gap-2">
                  {products.slice(0, 3).map((sp) => (
                    <StoreProductRow key={sp.id} sp={sp} />
                  ))}
                  {products.length > 3 && (
                    <p className="text-muted-foreground text-[10px]">+{products.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Orphan card ────────────────────────────────────────────────────

function OrphanCard({ orphan, onRefresh }: { orphan: OrphanItem; onRefresh: () => void }) {
  const byStore = new Map<number, StoreProductInfo[]>()
  for (const sp of orphan.storeProducts) {
    const group = byStore.get(sp.origin_id) || []
    group.push(sp)
    byStore.set(sp.origin_id, group)
  }
  const storeIds = [...byStore.keys()].sort()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <UnlinkIcon className="size-4 shrink-0 text-amber-500" />
              <span className="truncate font-mono">{orphan.gtin}</span>
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {orphan.brand && (
                <Badge variant="secondary" className="text-xs">
                  {orphan.brand}
                </Badge>
              )}
              {orphan.offProductName && (
                <span className="text-muted-foreground text-xs">OFF: {orphan.offProductName}</span>
              )}
              {orphan.gs1Prefix && (
                <span className="text-muted-foreground font-mono text-xs">GS1: {orphan.gs1Prefix}</span>
              )}
              <span className="text-muted-foreground text-xs">· trade_item #{orphan.tradeItemId}</span>
            </div>
            {orphan.canonicalName && (
              <p className="text-muted-foreground mt-1 text-xs">
                Current canonical: <span className="font-medium">{orphan.canonicalName}</span>
                {orphan.canonicalId && <span className="ml-1 font-mono">#{orphan.canonicalId}</span>}
              </p>
            )}
          </div>
          <div className="flex items-start gap-2">
            <LinkToCanonicalDialog barcode={orphan.gtin} onLinked={onRefresh} />
            <div className="flex gap-1">
              {storeIds.map((sid) => (
                <StoreBadge key={sid} originId={sid} />
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      {orphan.storeProducts.length > 0 && (
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {storeIds.map((sid) => {
              const products = byStore.get(sid) || []
              return (
                <div key={sid} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ backgroundColor: STORE_COLORS[sid] }} />
                    <span className="text-sm font-medium">{STORE_NAMES[sid] ?? `Store ${sid}`}</span>
                    <span className="text-muted-foreground text-xs">({products.length})</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {products.slice(0, 3).map((sp) => (
                      <StoreProductRow key={sp.id} sp={sp} />
                    ))}
                    {products.length > 3 && (
                      <p className="text-muted-foreground text-[10px]">+{products.length - 3} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Shared sub-components ──────────────────────────────────────────

function StoreProductRow({ sp }: { sp: StoreProductInfo }) {
  return (
    <div className="flex gap-2">
      {sp.image && <img src={sp.image} alt="" className="size-20 shrink-0 rounded-lg object-cover p-0.5" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs leading-tight">{sp.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {sp.price != null && <span className="text-xs font-semibold">{sp.price.toFixed(2)}€</span>}
          <span className="text-muted-foreground truncate font-mono text-[10px]">{sp.barcode}</span>
        </div>
      </div>
      {sp.url && (
        <a
          href={sp.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground shrink-0 self-start"
          aria-label="Open product page"
        >
          <ExternalLinkIcon className="size-3" />
        </a>
      )}
    </div>
  )
}

function StoreBadge({ originId }: { originId: number }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium")}
      style={{
        backgroundColor: STORE_COLORS[originId] ?? "#666",
      }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: STORE_COLORS_SECONDARY[originId] }} />
      <span className="text-xs font-medium">{STORE_NAMES[originId] ?? `Store ${originId}`}</span>
    </span>
  )
}
