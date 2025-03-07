import { cn, discountValueToPercentage } from "@/lib/utils"
import { PriceChange } from "./PriceChange"
import { Button } from "../ui/button"

type Props = {
  className?: string
  data: {
    price: number
    priceRecommended: number | null
    pricePerMajorUnit: number | null
    discount: number | null
    discountVariation: number
    priceVariation: number
    priceRecommendedVariation: number
    pricePerMajorUnitVariation: number
  }
  actions: {
    onPriceChange: () => void
    onPriceRecommendedChange: () => void
    onPricePerMajorUnitChange: () => void
    onDiscountChange: () => void
  }
}

export function PricesVariationCard({ data, actions, className }: Props) {
  const {
    price,
    priceRecommended,
    pricePerMajorUnit,
    discount,
    discountVariation,
    priceVariation,
    priceRecommendedVariation,
    pricePerMajorUnitVariation,
  } = data

  return (
    <div className={cn("flex flex-1 flex-col items-center gap-0.5", className)}>
      <button
        className="flex w-full items-center justify-between gap-2 hover:opacity-80"
        onClick={actions.onPriceChange}
      >
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-chart-1" />
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{price}€</span>
          <PriceChange variation={priceVariation} />
        </div>
      </button>

      <button
        className="flex w-full items-center justify-between gap-2 hover:opacity-80"
        onClick={actions.onPriceRecommendedChange}
      >
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-chart-2" />
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price Recommended</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{priceRecommended ?? "0"}€</span>
          <PriceChange variation={priceRecommendedVariation} />
        </div>
      </button>

      <button
        className="flex w-full items-center justify-between gap-2 hover:opacity-80"
        onClick={actions.onPricePerMajorUnitChange}
      >
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-chart-3" />
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price Per Unit</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{pricePerMajorUnit ?? "0"}€</span>
          <PriceChange variation={pricePerMajorUnitVariation} />
        </div>
      </button>

      <button
        className="flex w-full items-center justify-between gap-2 hover:opacity-80"
        onClick={actions.onDiscountChange}
      >
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-chart-4" />
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Discount</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{discount ? discountValueToPercentage(discount) : "0%"}</span>
          <PriceChange variation={discountVariation} />
        </div>
      </button>
    </div>
  )
}
