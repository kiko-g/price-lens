import Image from "next/image"
import { useTranslations } from "next-intl"
import type { OffProduct } from "@/lib/canonical/open-food-facts"
import { Badge } from "@/components/ui/badge"
import { Barcode } from "@/components/ui/combo/barcode"
import { TagIcon, PackageIcon, LayersIcon } from "lucide-react"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"
import { OpenFoodFactsLogo } from "@/components/icons/OpenFoodFacts"

interface OffProductCardProps {
  product: OffProduct
  barcode: string
}

export function OffProductCard({ product, barcode }: OffProductCardProps) {
  const t = useTranslations("products.offCard")
  const categories = product.categories
    ?.split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 5)

  return (
    <div className="border-border/60 bg-card w-full max-w-lg rounded-xl border p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.displayName || ""}
            width={80}
            height={80}
            className="h-24 w-auto shrink-0 rounded-lg border object-cover p-1"
            unoptimized
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <PackageIcon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{product.displayName}</h2>
          {product.brands && <p className="text-muted-foreground text-sm">{product.brands}</p>}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {product.quantity && (
          <Badge variant="secondary" className="gap-1">
            <TagIcon className="h-3 w-3" />
            {product.quantity}
          </Badge>
        )}
        <Badge variant="outline" className="gap-1">
          <OpenFoodFactsIcon className="h-3.5 w-3.5" />
          Open Food Facts
        </Badge>
      </div>

      {categories && categories.length > 0 && (
        <div className="mb-4">
          <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
            <LayersIcon className="h-3 w-3" />
            {t("categories")}
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

      <div className="flex justify-center pt-2">
        <Barcode value={barcode} height={40} width={1.5} />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <OpenFoodFactsLogo className="h-7 w-auto" />
        <p className="text-muted-foreground text-center text-sm">{t("externalNote")}</p>
      </div>
    </div>
  )
}
