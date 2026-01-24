import Link from "next/link"
import { cn } from "@/lib/utils"
import { discountValueToPercentage, generateProductPath } from "@/lib/business/product"
import { type StoreProduct } from "@/types"

import { Button } from "@/components/ui/button"
import { PriceChange } from "@/components/products/PriceChange"
import { resolveSupermarketChain } from "@/components/products/Supermarket"

import { ChevronRightIcon, ExternalLinkIcon, ArrowRightIcon } from "lucide-react"

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
    origin_id: origin,
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
      <div className={cn("flex flex-1 flex-col items-center gap-1 py-0.5", className)}>
        <PriceAxisButton
          isActive={isPriceActive}
          onClick={actions.onPriceChange}
          chartColor="chart-1"
          label="Price"
          value={price}
          variation={priceVariation}
        />

        <PriceAxisButton
          isActive={isPriceRecommendedActive}
          onClick={actions.onPriceRecommendedChange}
          chartColor="chart-2"
          label="Price without discount"
          value={priceRecommended ?? "0"}
          variation={priceRecommendedVariation}
        />

        <PriceAxisButton
          isActive={isPricePerMajorUnitActive}
          onClick={actions.onPricePerMajorUnitChange}
          chartColor="chart-3"
          label={`Price per unit (${majorUnit})`}
          value={pricePerMajorUnit ?? "0"}
          variation={pricePerMajorUnitVariation}
        />

        <PriceAxisButton
          isActive={isDiscountActive}
          onClick={actions.onDiscountChange}
          chartColor="chart-4"
          label="Discount"
          value={discount ? discountValueToPercentage(discount) : "0%"}
          variation={discountVariation}
          invertColors
          showEuro={false}
        />
      </div>

      {!options.hideExtraInfo && (
        <div className={cn("mt-3 flex items-center justify-start gap-2")}>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="max-w-28 gap-0.5 bg-white text-black hover:bg-white/90 dark:bg-white dark:hover:bg-white/90 [&_svg]:size-3"
          >
            <Link href={onlineUrl} target="_blank">
              {resolveSupermarketChain(origin)?.logoSmall}
              <ExternalLinkIcon />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="group text-xs transition-transform duration-300 [&_svg]:size-3"
          >
            <Link href={generateProductPath(storeProduct)}>
              See product
              <ArrowRightIcon className="group-hover:animate-bounce-x" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

type PriceAxisButtonProps = {
  isActive: boolean
  onClick: () => void
  chartColor: string
  label: string
  value: string | number
  variation: number
  invertColors?: boolean
  showEuro?: boolean
}

function PriceAxisButton({
  isActive,
  onClick,
  chartColor,
  label,
  value,
  variation,
  invertColors = false,
  showEuro = true,
}: PriceAxisButtonProps) {
  return (
    <button
      className={cn(
        "group flex w-full cursor-pointer items-center justify-between gap-3",
        isActive ? "opacity-100" : "opacity-50",
      )}
      onClick={onClick}
    >
      <div className="relative flex items-center gap-2">
        <div className="absolute top-1/2 -left-[20px] -translate-y-1/2 bg-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <ChevronRightIcon className="animate-bounce-x size-4" />
        </div>
        <span
          className="relative flex size-[17px] items-center justify-center rounded border-[1.5px]"
          style={{
            borderColor: `var(--${chartColor})`,
            backgroundColor: isActive
              ? `var(--${chartColor})`
              : `color-mix(in srgb, var(--${chartColor}) 20%, transparent)`,
          }}
        />
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <div className="flex items-center justify-end gap-1">
        <span className="mr-1">
          {value}
          {showEuro ? "€" : ""}
        </span>
        <PriceChange invertColors={invertColors} variation={variation} />
      </div>
    </button>
  )
}
