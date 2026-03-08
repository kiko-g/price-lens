import Image from "next/image"
import type { OffProduct } from "@/lib/canonical/open-food-facts"
import { Badge } from "@/components/ui/badge"
import { TagIcon, PackageIcon, LayersIcon, ExternalLinkIcon } from "lucide-react"
import { OffIcon } from "@/components/icons/OffIcon"
import { NutriScore } from "@/components/ui/combo/nutri-score"

interface OffProductCardProps {
  product: OffProduct
  barcode: string
}

type NutriScoreGrade = "A" | "B" | "C" | "D" | "E"

function isNutriScoreGrade(value: string | null): value is NutriScoreGrade {
  return value !== null && ["a", "b", "c", "d", "e"].includes(value.toLowerCase())
}

export function OffProductCard({ product, barcode }: OffProductCardProps) {
  const categories = product.categories
    ?.split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 5)

  const nutriGrade = isNutriScoreGrade(product.nutriscoreGrade)
    ? (product.nutriscoreGrade!.toUpperCase() as NutriScoreGrade)
    : null

  return (
    <div className="border-border/60 bg-card w-full max-w-2xl overflow-hidden rounded-2xl border shadow-sm">
      {/* Main content row */}
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
        {/* Product image */}
        <div className="flex shrink-0 justify-center sm:justify-start">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.displayName || "Product image"}
              width={120}
              height={120}
              className="h-28 w-28 rounded-xl border object-contain p-1.5"
              unoptimized
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border">
              <PackageIcon className="h-10 w-10" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Name + brand */}
          <div>
            <h2 className="text-balance text-xl font-semibold tracking-tight">{product.displayName}</h2>
            {product.brands && (
              <p className="text-muted-foreground mt-0.5 text-sm">{product.brands}</p>
            )}
          </div>

          {/* Quantity + source badge */}
          <div className="flex flex-wrap items-center gap-2">
            {product.quantity && (
              <Badge variant="secondary" className="gap-1">
                <TagIcon className="h-3 w-3" />
                {product.quantity}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 font-normal">
              <OffIcon className="h-3.5 w-3.5" />
              Open Food Facts
            </Badge>
            <span className="text-muted-foreground font-mono text-xs">{barcode}</span>
          </div>

          {/* Categories */}
          {categories && categories.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                <LayersIcon className="h-3 w-3" />
                Categories
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs font-normal">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nutri-Score — only render if available */}
      {nutriGrade && (
        <div className="border-border/60 border-t px-6 py-4">
          <NutriScore grade={nutriGrade} showNewCalculation />
        </div>
      )}

      {/* Footer attribution */}
      <div className="border-border/60 bg-muted/40 flex items-center justify-between gap-3 border-t px-6 py-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <OffIcon className="h-3.5 w-3.5 shrink-0" />
          Data sourced from Open Food Facts
        </div>
        <a
          href={`https://world.openfoodfacts.org/product/${barcode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
        >
          View full details
          <ExternalLinkIcon className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
