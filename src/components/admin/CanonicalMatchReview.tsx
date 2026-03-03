"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { STORE_NAMES, STORE_COLORS, STORE_COLORS_SECONDARY } from "@/types/business"

import { SearchIcon, Loader2, ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, LinkIcon } from "lucide-react"

interface TradeItemInfo {
  id: number
  gtin: string
  off_product_name: string | null
}

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

interface CanonicalMatch {
  canonicalId: number
  name: string
  brand: string | null
  barcodeCount: number
  storeCount: number
  tradeItems: TradeItemInfo[]
  storeProducts: StoreProductInfo[]
}

export function CanonicalMatchReview() {
  const [matches, setMatches] = useState<CanonicalMatch[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [minStores, setMinStores] = useState(2)
  const [loading, setLoading] = useState(true)

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        minStores: String(minStores),
      })
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/canonical-matches?${params}`)
      const json = await res.json()
      setMatches(json.data ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, search, minStores])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchMatches()
  }

  return (
    <div className="flex flex-col gap-6 overflow-auto p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Canonical Matches</h1>
        <p className="text-muted-foreground text-sm">
          Review cross-barcode product groupings. Each card shows a canonical product linked to multiple barcodes across
          different stores.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Search brand or product..."
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
          {total} canonical product{total !== 1 ? "s" : ""} matched across {minStores}+ stores
        </p>
      )}

      {/* Match cards */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-muted-foreground flex min-h-[30vh] items-center justify-center text-sm">
          No matches found.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((match) => (
            <MatchCard key={match.canonicalId} match={match} />
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

function MatchCard({ match }: { match: CanonicalMatch }) {
  // Group store products by origin_id
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
          <div className="flex gap-1">
            {storeIds.map((sid) => (
              <StoreBadge key={sid} originId={sid} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Barcodes with OFF names */}
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

        {/* Store products side by side */}
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
                    <div key={sp.id} className="flex gap-2">
                      {sp.image && (
                        <img src={sp.image} alt="" className="size-20 shrink-0 rounded-lg object-cover p-0.5" />
                      )}
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
