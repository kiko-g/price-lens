"use client"

import { useState } from "react"
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
import { STORE_NAMES, STORE_COLORS } from "@/types/business"
import { PlusIcon, Loader2, AlertTriangleIcon, CheckCircleIcon } from "lucide-react"

interface StoreProductPreview {
  id: number
  origin_id: number
  name: string
  brand: string | null
  barcode: string | null
  price: number | null
  image: string | null
}

interface PreviewData {
  barcode: string
  tradeItem: { id: number; gtin: string; canonical_product_id: number | null; off_product_name: string | null } | null
  currentCanonical: { id: number; name: string; brand: string | null } | null
  storeProducts: StoreProductPreview[]
}

interface Props {
  canonicalId: number
  canonicalName: string
  onLinked: () => void
}

export function LinkBarcodeDialog({ canonicalId, canonicalName, onLinked }: Props) {
  const [open, setOpen] = useState(false)
  const [barcode, setBarcode] = useState("")
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const reset = () => {
    setBarcode("")
    setPreview(null)
    setError(null)
    setSuccess(false)
    setLoading(false)
    setLinking(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) reset()
  }

  const handleLookup = async () => {
    const trimmed = barcode.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setPreview(null)

    try {
      const res = await fetch(`/api/admin/canonical-matches/link?barcode=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Lookup failed")
        return
      }
      setPreview(data)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async () => {
    if (!preview) return

    setLinking(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/canonical-matches/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: preview.barcode, canonicalProductId: canonicalId }),
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

  const alreadyLinkedToThis = preview?.currentCanonical?.id === canonicalId
  const linkedElsewhere = preview?.currentCanonical && preview.currentCanonical.id !== canonicalId

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <PlusIcon className="size-3.5" />
          Add barcode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add barcode to canonical</DialogTitle>
          <DialogDescription>
            Link a barcode to <span className="font-medium">{canonicalName}</span> (#{canonicalId})
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Barcode input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLookup()
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Enter barcode (EAN-13, etc.)"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="font-mono"
              autoFocus
            />
            <Button type="submit" disabled={!barcode.trim() || loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Look up"}
            </Button>
          </form>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertTriangleIcon className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
              <CheckCircleIcon className="size-4 shrink-0" />
              Linked successfully
            </div>
          )}

          {/* Preview */}
          {preview && !success && (
            <div className="flex flex-col gap-3">
              {/* Warning: already linked elsewhere */}
              {linkedElsewhere && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                  <span>
                    This barcode is currently linked to{" "}
                    <span className="font-medium">
                      {preview.currentCanonical!.name} (#{preview.currentCanonical!.id})
                    </span>
                    . Linking will reassign it.
                  </span>
                </div>
              )}

              {alreadyLinkedToThis && (
                <div className="text-muted-foreground text-sm">This barcode is already linked to this canonical.</div>
              )}

              {/* Trade item info */}
              {preview.tradeItem && (
                <div className="text-muted-foreground text-xs">
                  Trade item #{preview.tradeItem.id}
                  {preview.tradeItem.off_product_name && <span> OFF: {preview.tradeItem.off_product_name}</span>}
                </div>
              )}

              {!preview.tradeItem && (
                <div className="text-muted-foreground text-xs">No existing trade item: one will be created.</div>
              )}

              {/* Store products */}
              {preview.storeProducts.length > 0 ? (
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                    Store products with this barcode
                  </p>
                  <div className="flex flex-col gap-2">
                    {preview.storeProducts.map((sp) => (
                      <div key={sp.id} className="flex items-center gap-2">
                        {sp.image && <img src={sp.image} alt="" className="size-10 shrink-0 rounded object-cover" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{sp.name}</p>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="size-2 rounded-full"
                              style={{ backgroundColor: STORE_COLORS[sp.origin_id] }}
                            />
                            <span className="text-muted-foreground text-xs">
                              {STORE_NAMES[sp.origin_id] ?? `Store ${sp.origin_id}`}
                            </span>
                            {sp.price != null && (
                              <Badge variant="secondary" className="text-[10px]">
                                {sp.price.toFixed(2)}€
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No store products found with this barcode.</div>
              )}

              {/* Confirm button */}
              {!alreadyLinkedToThis && (
                <Button onClick={handleLink} disabled={linking} className="w-full">
                  {linking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : linkedElsewhere ? (
                    "Reassign to this canonical"
                  ) : (
                    "Link barcode"
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
