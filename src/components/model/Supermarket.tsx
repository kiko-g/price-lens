import { SupermarketProduct } from "@/types"
import { SupermarketChain } from "@/types/extra"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function SupermarketBadge({ supermarketChain, className }: { supermarketChain: string; className?: string }) {
  return (
    <Badge
      variant="default"
      size="xs"
      roundedness="sm"
      className={cn(
        "line-clamp-1 text-left text-2xs opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        className,
      )}
    >
      {supermarketChain}
    </Badge>
  )
}

export function resolveSupermarketChain(product: SupermarketProduct) {
  switch (product.origin_id) {
    case SupermarketChain.Continente:
      return {
        name: "Continente",
        badge: <SupermarketBadge supermarketChain="Continente" />,
      }
    case SupermarketChain.PingoDoce:
      return {
        name: "Pingo Doce",
        badge: <SupermarketBadge supermarketChain="Pingo Doce" />,
      }
    default:
      return null
  }
}
