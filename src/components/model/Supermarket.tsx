import { SupermarketChain } from "@/types/extra"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import Image from "next/image"
import ContinenteLogo from "@/images/brands/continente.svg"
import AuchanLogo from "@/images/brands/auchan.svg"
import PingoDoceLogo from "@/images/brands/pingo-doce.svg"

function SupermarketBadge({ supermarketChain, className }: { supermarketChain: string; className?: string }) {
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
      {supermarketChain}
    </Badge>
  )
}

export function resolveSupermarketChain(originId: number | null) {
  switch (originId) {
    case SupermarketChain.Continente:
      return {
        name: "Continente",
        badge: <SupermarketBadge supermarketChain="Continente" />,
        logo: (
          <Image
            src={ContinenteLogo}
            alt="Continente"
            width={300}
            height={300}
            className="h-5 w-auto md:h-5 md:w-min"
          />
        ),
        logoSmall: (
          <Image
            src={ContinenteLogo}
            alt="Continente"
            width={300}
            height={300}
            className="h-3.5 w-auto md:h-3.5 md:w-min"
          />
        ),
      }
    case SupermarketChain.Auchan:
      return {
        name: "Auchan",
        badge: <SupermarketBadge supermarketChain="Auchan" />,
        logo: <Image src={AuchanLogo} alt="Auchan" width={300} height={300} className="h-5 w-auto md:h-5 md:w-min" />,
        logoSmall: (
          <Image src={AuchanLogo} alt="Auchan" width={300} height={300} className="h-4 w-full md:h-4 md:w-min" />
        ),
      }
    case SupermarketChain.PingoDoce:
      return {
        name: "Pingo Doce",
        badge: <SupermarketBadge supermarketChain="Pingo Doce" />,
        logo: (
          <Image src={PingoDoceLogo} alt="Pingo Doce" width={300} height={300} className="h-5 w-auto md:h-5 md:w-min" />
        ),
        logoSmall: (
          <Image
            src={PingoDoceLogo}
            alt="Pingo Doce"
            width={300}
            height={300}
            className="h-3.5 w-auto md:h-3.5 md:w-min"
          />
        ),
      }
    default:
      return null
  }
}
