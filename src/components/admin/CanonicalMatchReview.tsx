"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { STORE_NAMES, STORE_COLORS, STORE_COLORS_SECONDARY } from "@/types/business"

import { LinkBarcodeDialog } from "@/components/admin/LinkBarcodeDialog"
import { LinkToCanonicalDialog } from "@/components/admin/LinkToCanonicalDialog"

import {
  SearchIcon,
  Loader2,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  UnlinkIcon,
  Trash2Icon,
  ChevronDownIcon,
  PackageIcon,
  XIcon,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface StoreProductInfo {
  id: number
  origin_id: number
  name: string
  brand: string | null
  barcode: string | null
  price: number | null
  price_recommended: number | null
  image: string | null
  url: string | null
}

interface TradeItemInfo {
  id: number
  gtin: string
  off_product_name: string | null
}

interface CanonicalProduct {
  canonicalId: number
  name: string
  brand: string | null
  source: string
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

type View = "canonicals" | "orphans"

// ─── Main component ─────────────────────────────────────────────────

export function CanonicalMatchReview() {
  const [view, setView] = useState<View>("canonicals")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const [canonicals, setCanonicals] = useState<CanonicalProduct[]>([])
  const [minStores, setMinStores] = useState("1")
  const [minBarcodes, setMinBarcodes] = useState("1")

  const [orphans, setOrphans] = useState<OrphanItem[]>([])

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (view === "canonicals") {
        params.set("minStores", minStores)
        params.set("minBarcodes", minBarcodes)
      } else {
        params.set("view", "orphans")
      }
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/canonical-matches?${params}`)
      if (!res.ok) {
        setError(`Request failed (${res.status})`)
        return
      }
      const json = await res.json()

      if (view === "canonicals") {
        setCanonicals(json.data ?? [])
      } else {
        setOrphans(json.data ?? [])
      }
      setTotal(json.total ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [view, page, search, minStores, minBarcodes])

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
        <h1 className="text-2xl font-bold tracking-tight">Canonical Products</h1>
        <p className="text-muted-foreground text-sm">
          {view === "canonicals"
            ? "Browse and manage canonical product groupings. Delete bad matches, unlink barcodes, or add new ones."
            : "Orphan trade items with single-barcode canonicals. Link them to multi-barcode canonical products."}
        </p>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          variant={view === "canonicals" ? "default" : "outline"}
          size="sm"
          onClick={() => switchView("canonicals")}
          className="gap-1.5"
        >
          <PackageIcon className="size-3.5" />
          Canonicals
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
        {view === "canonicals" ? (
          <div className="flex gap-2">
            <Select
              value={minBarcodes}
              onValueChange={(v) => {
                setMinBarcodes(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Barcodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1+ Barcodes</SelectItem>
                <SelectItem value="2">2+ Barcodes</SelectItem>
                <SelectItem value="3">3+ Barcodes</SelectItem>
                <SelectItem value="4">4+ Barcodes (review)</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={minStores}
              onValueChange={(v) => {
                setMinStores(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1+ Stores</SelectItem>
                <SelectItem value="2">2+ Stores</SelectItem>
                <SelectItem value="3">All 3 Stores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div />
        )}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Search name, brand, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
        </form>
      </div>

      {/* Summary */}
      {!loading && !error && (
        <p className="text-muted-foreground text-sm">
          {view === "canonicals"
            ? `${total} canonical product${total !== 1 ? "s" : ""}`
            : `${total} orphan${total !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Content */}
      {error ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : view === "canonicals" ? (
        canonicals.length === 0 ? (
          <div className="text-muted-foreground flex min-h-[30vh] items-center justify-center text-sm">
            No canonical products found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {canonicals.map((cp) => (
              <CanonicalCard key={cp.canonicalId} canonical={cp} onRefresh={fetchData} />
            ))}
          </div>
        )
      ) : orphans.length === 0 ? (
        <div className="text-muted-foreground flex min-h-[30vh] items-center justify-center text-sm">
          No orphans found.
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

// ─── Canonical card ─────────────────────────────────────────────────

function CanonicalCard({ canonical, onRefresh }: { canonical: CanonicalProduct; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [unlinking, setUnlinking] = useState<string | null>(null)

  const byStore = new Map<number, StoreProductInfo[]>()
  for (const sp of canonical.storeProducts) {
    const group = byStore.get(sp.origin_id) || []
    group.push(sp)
    byStore.set(sp.origin_id, group)
  }
  const storeIds = [...byStore.keys()].sort()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/canonical-matches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalId: canonical.canonicalId }),
      })
      if (res.ok) {
        onRefresh()
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleUnlink = async (barcode: string) => {
    setUnlinking(barcode)
    try {
      const res = await fetch("/api/admin/canonical-matches/link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      })
      if (res.ok) {
        onRefresh()
      }
    } finally {
      setUnlinking(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageIcon className="size-4 shrink-0" />
              <span className="truncate">{canonical.name}</span>
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {canonical.brand && (
                <Badge variant="secondary" className="text-xs">
                  {canonical.brand}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {canonical.source}
              </Badge>
              {canonical.source === "auto" && canonical.barcodeCount > 3 && (
                <Badge variant="destructive" className="text-xs">
                  {canonical.barcodeCount} GTINs (review)
                </Badge>
              )}
              <span className="text-muted-foreground text-xs">
                {canonical.barcodeCount} barcode{canonical.barcodeCount !== 1 ? "s" : ""} · {canonical.storeCount} store
                {canonical.storeCount !== 1 ? "s" : ""}
              </span>
              <span className="text-muted-foreground text-xs">· #{canonical.canonicalId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LinkBarcodeDialog
              canonicalId={canonical.canonicalId}
              canonicalName={canonical.name}
              onLinked={onRefresh}
            />
            <div className="flex gap-1">
              {storeIds.map((sid) => (
                <StoreBadge key={sid} originId={sid} />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 px-2"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <ChevronDownIcon className={cn("size-4 transition-transform", expanded && "rotate-180")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {/* Barcodes with unlink */}
          <div className="mb-4">
            <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">Barcodes</p>
            <div className="flex flex-wrap gap-2">
              {canonical.tradeItems.map((ti) => (
                <div key={ti.id} className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                  <span className="font-mono">{ti.gtin}</span>
                  {ti.off_product_name && <span className="text-muted-foreground ml-1">({ti.off_product_name})</span>}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive ml-1 h-5 w-5 p-0"
                    onClick={() => handleUnlink(ti.gtin)}
                    disabled={unlinking === ti.gtin}
                    aria-label={`Unlink ${ti.gtin}`}
                    tabIndex={0}
                  >
                    {unlinking === ti.gtin ? <Loader2 className="size-3 animate-spin" /> : <XIcon className="size-3" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Store products grouped by store */}
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

          {/* Delete section */}
          <div className="mt-4 flex justify-end border-t pt-3">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-destructive text-sm">Delete this canonical?</span>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : "Confirm"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-1.5"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2Icon className="size-3.5" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      )}
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
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {sp.price != null && <span className="text-xs font-semibold">{sp.price.toFixed(2)}€</span>}
          {sp.price_recommended != null && sp.price_recommended > 0 && (
            <span className="text-muted-foreground text-[10px]" title="Preço recomendado (PVR)">
              PVR {sp.price_recommended.toFixed(2)}€
            </span>
          )}
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
          tabIndex={0}
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
        color: "white",
        backgroundColor: STORE_COLORS[originId] ?? "#666",
      }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: STORE_COLORS_SECONDARY[originId] }} />
      <span className="text-xs font-medium">{STORE_NAMES[originId] ?? `Store ${originId}`}</span>
    </span>
  )
}
