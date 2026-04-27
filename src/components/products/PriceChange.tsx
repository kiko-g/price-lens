import { cn } from "@/lib/utils"
import { formatPercentFixed, PLUS_SIGN } from "@/lib/i18n/formatting-glyphs"
import { TriangleIcon, EqualIcon } from "lucide-react"

export function PriceChange({
  variation,
  invertColors,
  decimalPlaces = 1,
}: {
  variation: number
  invertColors?: boolean
  decimalPlaces?: number
}) {
  const pctLabel =
    variation > 0
      ? `${PLUS_SIGN}${formatPercentFixed(variation * 100, decimalPlaces)}`
      : formatPercentFixed(variation * 100, decimalPlaces)

  const textColor = invertColors
    ? variation < 0
      ? "text-red-500"
      : variation > 0
        ? "text-green-500"
        : "text-muted-foreground"
    : variation < 0
      ? "text-green-500"
      : variation > 0
        ? "text-red-500"
        : "text-muted-foreground"

  const triangleColor = invertColors
    ? variation < 0
      ? "rotate-180 fill-red-500 stroke-red-500"
      : "fill-green-500 stroke-green-500"
    : variation < 0
      ? "rotate-180 fill-green-500 stroke-green-500"
      : "fill-red-500 stroke-red-500"

  return (
    <div className="flex min-w-16 items-center justify-end gap-1">
      <span className={cn(textColor)}>{pctLabel}</span>
      {variation === 0 ? (
        <EqualIcon className="text-muted-foreground h-3 w-3" />
      ) : (
        <TriangleIcon className={cn("h-3 w-3", triangleColor)} />
      )}
    </div>
  )
}
