import Link from "next/link"
import { cn, discountValueToPercentage } from "@/lib/utils"
import { type StoreProduct } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PriceChange } from "@/components/model/PriceChange"
import { resolveSupermarketChain } from "@/components/model/Supermarket"

import { ChevronRightIcon, ExternalLinkIcon, InfoIcon, ArrowRightIcon } from "lucide-react"

type Props = {
  className?: string
  data: {
    discountVariation: number
    priceVariation: number
    priceRecommendedVariation: number
    pricePerMajorUnitVariation: number
    storeProduct: StoreProduct
  }
  options: {
    hideExtraInfo: boolean
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

const defaultOptions: Props["options"] = {
  hideExtraInfo: true,
}

export function PricesVariationCard({ className, data, actions, state, options = defaultOptions }: Props) {
  const { storeProduct, discountVariation, priceVariation, priceRecommendedVariation, pricePerMajorUnitVariation } =
    data

  const {
    url: onlineUrl,
    price,
    origin_id: originId,
    major_unit: majorUnit,
    price_recommended: priceRecommended,
    price_per_major_unit: pricePerMajorUnit,
    discount,
  } = storeProduct

  const { activeAxis } = state
  const isPriceActive = activeAxis.includes("price")
  const isPriceRecommendedActive = activeAxis.includes("price-recommended")
  const isPricePerMajorUnitActive = activeAxis.includes("price-per-major-unit")
  const isDiscountActive = activeAxis.includes("discount")

  return (
    <div>
      <div className={cn("flex flex-1 flex-col items-center gap-1", className)}>
        <button
          className={cn(
            "group flex w-full cursor-pointer items-center justify-between gap-2",
            isPriceActive ? "opacity-100" : "opacity-50",
          )}
          onClick={actions.onPriceChange}
        >
          <div className="relative flex items-center gap-2">
            <div className="absolute top-1/2 -left-[20px] -translate-y-1/2 bg-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <ChevronRightIcon className="animate-bounce-x size-4" />
            </div>
            <span
              className={cn(
                "border-chart-1 relative flex size-[17px] items-center justify-center rounded border-[1.5px]",
                isPriceActive ? "bg-chart-1" : "bg-chart-1/20",
              )}
            />
            <span className="whitespace-nowrap">Price</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <span className="mr-1">{price}€</span>
            <PriceChange variation={priceVariation} />
          </div>
        </button>

        <button
          className={cn(
            "group flex w-full cursor-pointer items-center justify-between gap-2",
            isPriceRecommendedActive ? "opacity-100" : "opacity-50",
          )}
          onClick={actions.onPriceRecommendedChange}
        >
          <div className="relative flex items-center gap-2">
            <div className="absolute top-1/2 -left-[20px] -translate-y-1/2 bg-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <ChevronRightIcon className="animate-bounce-x size-4" />
            </div>
            <span
              className={cn(
                "border-chart-2 relative flex size-[17px] items-center justify-center rounded border-[1.5px]",
                isPriceRecommendedActive ? "bg-chart-2" : "bg-chart-2/20",
              )}
            />
            <span className="whitespace-nowrap">Price with discount</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <span className="mr-1">{priceRecommended ?? "0"}€</span>
            <PriceChange variation={priceRecommendedVariation} />
          </div>
        </button>

        <button
          className={cn(
            "group flex w-full items-center justify-between gap-2",
            isPricePerMajorUnitActive ? "opacity-100" : "opacity-50",
          )}
          onClick={actions.onPricePerMajorUnitChange}
        >
          <div className="relative flex items-center gap-2">
            <div className="absolute top-1/2 -left-[20px] -translate-y-1/2 bg-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <ChevronRightIcon className="animate-bounce-x size-4" />
            </div>
            <span
              className={cn(
                "border-chart-3 relative flex size-[17px] items-center justify-center rounded border-[1.5px]",
                isPricePerMajorUnitActive ? "bg-chart-3" : "bg-chart-3/20",
              )}
            />
            <span className="whitespace-nowrap">Price per unit ({majorUnit})</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <span className="mr-1">{pricePerMajorUnit ?? "0"}€</span>
            <PriceChange variation={pricePerMajorUnitVariation} />
          </div>
        </button>

        <button
          className={cn(
            "group flex w-full cursor-pointer items-center justify-between gap-2",
            isDiscountActive ? "opacity-100" : "opacity-50",
          )}
          onClick={actions.onDiscountChange}
        >
          <div className="relative flex items-center gap-2">
            <div className="absolute top-1/2 -left-[20px] -translate-y-1/2 bg-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <ChevronRightIcon className="animate-bounce-x size-4" />
            </div>
            <span
              className={cn(
                "border-chart-4 relative flex size-[17px] items-center justify-center rounded border-[1.5px]",
                isDiscountActive ? "bg-chart-4" : "bg-chart-4/20",
              )}
            />
            <span className="whitespace-nowrap">Discount</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <span className="mr-1">{discount ? discountValueToPercentage(discount) : "0%"}</span>
            <PriceChange invertColors variation={discountVariation} />
          </div>
        </button>
      </div>

      {!options.hideExtraInfo && (
        <div className={cn("mt-2 flex items-center justify-start gap-2")}>
          <Button variant="outline" size="sm" asChild className="gap-0.5 [&_svg]:size-3">
            <Link href={onlineUrl} target="_blank">
              {resolveSupermarketChain(originId)?.logoSmall}
              <ExternalLinkIcon />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="group text-xs transition-transform duration-300 [&_svg]:size-3"
          >
            <Link href={`/supermarket/${storeProduct.id}`}>
              See product
              <ArrowRightIcon className="group-hover:animate-bounce-x" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
