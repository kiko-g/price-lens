"use client"

import { useCallback, useEffect, useState } from "react"
import {
  SearchIcon,
  Loader2,
  CheckCircle2Icon,
  XCircleIcon,
  ZapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TradeItemData {
  id: number
  gtin: string
  gtin_format: string
  gs1_prefix: string | null
  canonical_product_id: number | null
  off_product_name: string | null
  created_at: string
}

interface Stats {
  total: number
  enriched: number
  missing: number
}

interface OffResult {
  productName: string | null
  displayName: string | null
  brands: string | null
  quantity: string | null
  categories: string | null
}

type Filter = "all" | "enriched" | "missing"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TradeItemExplorer() {
  const [items, setItems] = useState<TradeItemData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [loading, setLoading] = useState(true)

  // Live OFF lookup
  const [lookupBarcode, setLookupBarcode] = useState("")
  const [lookupResult, setLookupResult] = useState<{ barcode: string; off: OffResult | null } | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  const limit = 50
  const totalPages = Math.ceil(total / limit)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), filter })
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/trade-items?${params}`)
      const json = await res.json()
      setItems(json.data ?? [])
      setTotal(json.total ?? 0)
      setStats(json.stats ?? null)
    } finally {
      setLoading(false)
    }
  }, [page, search, filter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchItems()
  }

  const handleLookup = async () => {
    const barcode = lookupBarcode.trim()
    if (!barcode) return
    setLookupLoading(true)
    setLookupResult(null)
    try {
      const res = await fetch("/api/admin/trade-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      })
      const json = await res.json()
      setLookupResult(json)
    } finally {
      setLookupLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 overflow-auto p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Trade Items</h1>
        <p className="text-muted-foreground text-sm">
          Explore barcode trade items and their Open Food Facts enrichment data.
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Total Trade Items" value={stats.total} />
          <StatCard
            title="OFF Enriched"
            value={stats.enriched}
            subtitle={stats.total > 0 ? `${((stats.enriched / stats.total) * 100).toFixed(1)}%` : undefined}
            variant="success"
          />
          <StatCard
            title="Missing OFF Data"
            value={stats.missing}
            subtitle={stats.total > 0 ? `${((stats.missing / stats.total) * 100).toFixed(1)}%` : undefined}
            variant="warning"
          />
        </div>
      )}

      {/* Live OFF lookup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ZapIcon className="size-4" />
            Live OFF Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter a barcode (e.g. 5601312019183)"
              value={lookupBarcode}
              onChange={(e) => setLookupBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="max-w-sm font-mono"
            />
            <Button onClick={handleLookup} disabled={lookupLoading || !lookupBarcode.trim()}>
              {lookupLoading ? <Loader2 className="size-4 animate-spin" /> : "Lookup"}
            </Button>
          </div>
          {lookupResult && (
            <div className="mt-4 rounded-lg border p-4">
              <p className="mb-2 font-mono text-sm">
                Barcode: <span className="font-bold">{lookupResult.barcode}</span>
              </p>
              {lookupResult.off ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground font-medium">Display Name</dt>
                  <dd className="font-semibold">{lookupResult.off.displayName ?? "—"}</dd>
                  <dt className="text-muted-foreground font-medium">Raw Name</dt>
                  <dd className="text-muted-foreground">{lookupResult.off.productName ?? "—"}</dd>
                  <dt className="text-muted-foreground font-medium">Brands</dt>
                  <dd>{lookupResult.off.brands ?? "—"}</dd>
                  <dt className="text-muted-foreground font-medium">Quantity</dt>
                  <dd>{lookupResult.off.quantity ?? "—"}</dd>
                  <dt className="text-muted-foreground font-medium">Categories</dt>
                  <dd className="max-w-lg truncate">{lookupResult.off.categories ?? "—"}</dd>
                </dl>
              ) : (
                <p className="text-muted-foreground text-sm italic">Not found in Open Food Facts.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["all", "enriched", "missing"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(f)
                setPage(1)
              }}
            >
              {f === "all" ? "All" : f === "enriched" ? "OFF Enriched" : "Missing OFF"}
            </Button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Search barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9 font-mono"
            />
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">GTIN</TableHead>
              <TableHead className="w-24">Format</TableHead>
              <TableHead>OFF Product Name</TableHead>
              <TableHead className="w-32">Canonical ID</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-32 text-center">
                  No trade items found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.gtin}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs uppercase">
                      {item.gtin_format}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "max-w-xs truncate text-sm",
                      !item.off_product_name && "text-muted-foreground italic",
                    )}
                  >
                    {item.off_product_name ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.canonical_product_id ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.off_product_name ? (
                      <CheckCircle2Icon className="mx-auto size-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="text-muted-foreground mx-auto size-4" />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} ({total} items)
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

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function StatCard({
  title,
  value,
  subtitle,
  variant,
}: {
  title: string
  value: number
  subtitle?: string
  variant?: "success" | "warning"
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          {subtitle && (
            <span
              className={cn(
                "text-sm font-medium",
                variant === "success" && "text-green-600 dark:text-green-400",
                variant === "warning" && "text-amber-600 dark:text-amber-400",
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
