"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import type { OffProduct } from "@/lib/canonical/open-food-facts"

import { Button } from "@/components/ui/button"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"

import { Loader2Icon, PackageIcon } from "lucide-react"

interface OffBrandSectionProps {
  brand: string
  excludeBarcode: string
}

export function OffBrandSection({ brand, excludeBarcode }: OffBrandSectionProps) {
  const [products, setProducts] = useState<OffProduct[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleLoad = async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ brand, exclude: excludeBarcode })
      const res = await fetch(`/api/off/brand?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data: OffProduct[] = await res.json()
      setProducts(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (products !== null && products.length === 0) {
    return null
  }

  if (products !== null && products.length > 0) {
    return (
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <OpenFoodFactsIcon className="h-5 w-5" />
          More from {brand} on Open Food Facts
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((rp) => (
            <OffRelatedCard key={rp.barcode} product={rp} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="flex items-center gap-3">
      <Button variant="outline" onClick={handleLoad} disabled={loading} className="gap-2">
        {loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <OpenFoodFactsIcon className="h-4 w-4" />}
        {loading ? "Loading..." : `See more from ${brand} on Open Food Facts`}
      </Button>
      {error && <span className="text-muted-foreground text-sm">Could not load products. Try again later.</span>}
    </section>
  )
}

function OffRelatedCard({ product }: { product: OffProduct }) {
  if (!product.barcode) return null

  return (
    <Link
      href={`/products/barcode/${product.barcode}`}
      className="bg-card group flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden border-b bg-white">
        {product.imageSmallUrl ? (
          <Image
            src={product.imageSmallUrl}
            alt={product.displayName || "Product"}
            fill
            className="object-contain p-2 transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PackageIcon className="text-muted-foreground h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-sm leading-tight font-medium">{product.displayName}</p>
        {product.quantity && <p className="text-muted-foreground text-xs">{product.quantity}</p>}
      </div>
    </Link>
  )
}
