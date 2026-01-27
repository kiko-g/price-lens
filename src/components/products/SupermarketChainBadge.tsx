import { SupermarketChain } from "@/types/business"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image, { type StaticImageData } from "next/image"
import ContinenteLogo from "@/images/brands/continente.svg"
import AuchanLogo from "@/images/brands/auchan.svg"
import PingoDoceLogo from "@/images/brands/pingo-doce.svg"

type SupermarketInfo = {
  name: string
  logo: StaticImageData
}

function getSupermarketInfo(originId: number | null): SupermarketInfo | null {
  switch (originId) {
    case SupermarketChain.Continente:
      return { name: "Continente", logo: ContinenteLogo }
    case SupermarketChain.Auchan:
      return { name: "Auchan", logo: AuchanLogo }
    case SupermarketChain.PingoDoce:
      return { name: "Pingo Doce", logo: PingoDoceLogo }
    default:
      return null
  }
}

export function getSupermarketChainName(originId: number | null): string | null {
  return getSupermarketInfo(originId)?.name ?? null
}

type SupermarketChainBadgeVariant = "badge" | "logo" | "logoSmall"

type SupermarketChainBadgeProps = {
  originId: number | null
  variant?: SupermarketChainBadgeVariant
  className?: string
}

export function SupermarketChainBadge({ originId, variant = "badge", className }: SupermarketChainBadgeProps) {
  const info = getSupermarketInfo(originId)

  if (!info) return null

  switch (variant) {
    case "badge":
      return (
        <Badge
          size="xs"
          roundedness="sm"
          variant="dark"
          className={cn(
            "text-2xs line-clamp-1 text-left opacity-80 transition-opacity duration-300 group-hover:opacity-100",
            className,
          )}
        >
          {info.name}
        </Badge>
      )
    case "logo":
      return (
        <Image
          src={info.logo}
          alt={info.name}
          width={600}
          height={200}
          className={cn("h-5 w-auto md:h-5 md:w-min", className)}
        />
      )
    case "logoSmall":
      return (
        <Image
          src={info.logo}
          alt={info.name}
          width={600}
          height={200}
          className={cn("h-3.5 w-auto md:h-3.5 md:w-min", className)}
        />
      )
  }
}
