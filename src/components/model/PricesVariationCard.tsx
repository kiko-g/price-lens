import { cn, discountValueToPercentage } from "@/lib/utils"
import { PriceChange } from "./PriceChange"

type Props = {
  price: number
  priceRecommended: number | null
  pricePerMajorUnit: number | null
  discount: number | null
  discountVariation: number
  priceVariation: number
  priceRecommendedVariation: number
  pricePerMajorUnitVariation: number
  className?: string
}

export function PricesVariationCard({
  price,
  priceRecommended,
  pricePerMajorUnit,
  discount,
  discountVariation,
  priceVariation,
  priceRecommendedVariation,
  pricePerMajorUnitVariation,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-1 flex-col items-center gap-0.5", className)}>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-chart-1" />
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{price}€</span>
          <PriceChange variation={priceVariation} />
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-chart-2" />
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price Recommended</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{priceRecommended ?? "0"}€</span>
          <PriceChange variation={priceRecommendedVariation} />
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-chart-3" />
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price Per Unit</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{pricePerMajorUnit ?? "0"}€</span>
          <PriceChange variation={pricePerMajorUnitVariation} />
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-chart-4" />
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Discount</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{discount ? discountValueToPercentage(discount) : "0%"}</span>
          <PriceChange variation={discountVariation} />
        </div>
      </div>
    </div>
  )
}
