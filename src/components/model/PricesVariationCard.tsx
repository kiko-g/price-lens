import { cn, discountValueToPercentage } from "@/lib/utils"
import { PriceChange } from "./PriceChange"
import { Button } from "../ui/button"
import { CheckIcon } from "lucide-react"

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
  state: {
    activeAxis: string[]
  }
  actions: {
    onPriceChange: () => void
    onPriceRecommendedChange: () => void
    onPricePerMajorUnitChange: () => void
    onDiscountChange: () => void
  }
}

export function PricesVariationCard({ className, data, actions, state }: Props) {
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

  const { activeAxis } = state
  const isPriceActive = activeAxis.includes("price")
  const isPriceRecommendedActive = activeAxis.includes("price-recommended")
  const isPricePerMajorUnitActive = activeAxis.includes("price-per-major-unit")
  const isDiscountActive = activeAxis.includes("discount")

  return (
    <div className={cn("flex flex-1 flex-col items-center gap-1", className)}>
      <button
        className={cn("flex w-full items-center justify-between gap-2 hover:opacity-80")}
        onClick={actions.onPriceChange}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "relative flex size-4 items-center justify-center rounded-full border-[1.5px] border-chart-1",
              isPriceActive ? "bg-chart-1" : "bg-chart-1/20",
            )}
          >
            {isPriceActive && <CheckIcon className="absolute inset-0 mx-auto size-2.5 self-center text-white" />}
          </span>
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{price}€</span>
          <PriceChange variation={priceVariation} />
        </div>
      </button>

      <button
        className={cn("flex w-full items-center justify-between gap-2 hover:opacity-80")}
        onClick={actions.onPricePerMajorUnitChange}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "relative flex size-4 items-center justify-center rounded-full border-[1.5px] border-chart-3",
              isPricePerMajorUnitActive ? "bg-chart-3" : "bg-chart-3/20",
            )}
          >
            {isPricePerMajorUnitActive && (
              <CheckIcon className="absolute inset-0 mx-auto size-2.5 self-center text-white" />
            )}
          </span>
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price Per Major Unit</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{pricePerMajorUnit ?? "0"}€</span>
          <PriceChange variation={pricePerMajorUnitVariation} />
        </div>
      </button>

      <button
        className={cn("flex w-full items-center justify-between gap-2 hover:opacity-80")}
        onClick={actions.onPriceRecommendedChange}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "relative flex size-4 items-center justify-center rounded-full border-[1.5px] border-chart-2",
              isPriceRecommendedActive ? "bg-chart-2" : "bg-chart-2/20",
            )}
          >
            {isPriceRecommendedActive && (
              <CheckIcon className="absolute inset-0 mx-auto size-2.5 self-center text-white" />
            )}
          </span>
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price Recommended</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{priceRecommended ?? "0"}€</span>
          <PriceChange variation={priceRecommendedVariation} />
        </div>
      </button>

      <button
        className={cn("flex w-full items-center justify-between gap-2 hover:opacity-80")}
        onClick={actions.onDiscountChange}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "relative flex size-4 items-center justify-center rounded-full border-[1.5px] border-chart-4",
              isDiscountActive ? "bg-chart-4" : "bg-chart-4/20",
            )}
          >
            {isDiscountActive && <CheckIcon className="absolute inset-0 mx-auto size-2.5 self-center text-white" />}
          </span>
          <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Discount</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1">{discount ? discountValueToPercentage(discount) : "0%"}</span>
          <PriceChange invertColors variation={discountVariation} />
        </div>
      </button>
    </div>
  )
}
