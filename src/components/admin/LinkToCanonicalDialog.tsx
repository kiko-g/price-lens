"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LinkIcon, Loader2, SearchIcon, AlertTriangleIcon, CheckCircleIcon } from "lucide-react"
import { STORE_NAMES, STORE_COLORS } from "@/types/business"

interface StoreProductSample {
  name: string
  origin_id: number
}

interface CanonicalResult {
  id: number
  name: string
  brand: string | null
  barcodes: string[]
  barcodeCount: number
  storeProducts: StoreProductSample[]
}

interface Props {
  barcode: string
  onLinked: () => void
}

export function LinkToCanonicalDialog({ barcode, onLinked }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CanonicalResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<CanonicalResult | null>(null)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const reset = () => {
    setQuery("")
    setResults([])
    setSelected(null)
    setError(null)
    setSuccess(false)
    setSearching(false)
    setLinking(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) reset()
  }

  useEffect(() => {
    if (!open) return
    if (query.length < 2) {
      setResults([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/canonical-matches/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.data ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query, open])

  const handleLink = async () => {
    if (!selected) return
    setLinking(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/canonical-matches/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, canonicalProductId: selected.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Link failed")
        return
      }
      setSuccess(true)
      setTimeout(() => {
        handleOpenChange(false)
        onLinked()
      }, 800)
    } catch {
      setError("Network error")
    } finally {
      setLinking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <LinkIcon className="size-3.5" />
          Link to canonical
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Link to canonical product</DialogTitle>
          <DialogDescription>
            Find a canonical product to link barcode <span className="font-mono font-medium">{barcode}</span> to.
            <br />
            Search by barcode, product name, or brand.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Type a barcode, product name, or brand..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelected(null)
              }}
              className="pl-9"
              autoFocus
            />
          </div>

          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="max-h-80 overflow-y-auto rounded-lg border">
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className={`flex w-full flex-col gap-1.5 border-b px-3 py-2.5 text-left text-sm transition-colors last:border-0 ${
                    selected?.id === c.id ? "bg-primary/10 border-primary/20" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="leading-snug font-medium">{c.name}</p>
                      {c.brand && <span className="text-muted-foreground text-xs">{c.brand}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {selected?.id === c.id && (
                        <Badge variant="default" className="text-[10px]">
                          Selected
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {c.barcodeCount} barcode{c.barcodeCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>

                  {c.barcodes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.barcodes.slice(0, 4).map((b) => (
                        <span key={b} className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
                          {b}
                        </span>
                      ))}
                      {c.barcodes.length > 4 && (
                        <span className="text-muted-foreground text-[10px]">+{c.barcodes.length - 4} more</span>
                      )}
                    </div>
                  )}

                  {c.storeProducts.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {c.storeProducts.map((sp, i) => (
                        <span key={i} className="text-muted-foreground flex items-center gap-1 text-[11px]">
                          <span
                            className="inline-block size-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: STORE_COLORS[sp.origin_id] }}
                          />
                          <span className="max-w-[200px] truncate">
                            {STORE_NAMES[sp.origin_id]}: {sp.name}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!searching && query.length >= 2 && results.length === 0 && (
            <p className="text-muted-foreground py-2 text-center text-sm">No canonicals found.</p>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertTriangleIcon className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
              <CheckCircleIcon className="size-4 shrink-0" />
              Linked successfully
            </div>
          )}

          {selected && !success && (
            <Button onClick={handleLink} disabled={linking} className="w-full">
              {linking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Link to &quot;{selected.name}&quot; (#{selected.id})
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
