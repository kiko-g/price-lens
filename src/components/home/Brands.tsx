import Image from "next/image"
import { cn } from "@/lib/utils"

import auchan from "@/images/brands/auchan.svg"
import continente from "@/images/brands/continente.svg"
import pingoDoce from "@/images/brands/pingo-doce.svg"
import lidl from "@/images/brands/lidl.svg"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Brands({ className }: { className?: string }) {
  const brands = [
    {
      name: "Continente",
      image: continente,
      disabled: false,
      shown: true,
      className: "h-10",
    },
    {
      name: "Auchan",
      image: auchan,
      disabled: true,
      shown: true,
      className: "h-10",
    },
    {
      name: "Pingo Doce",
      image: pingoDoce,
      disabled: true,
      shown: true,
      className: "h-10 rounded dark:bg-white",
    },
  ]
  return (
    <div
      className={cn(
        "mx-auto mt-10 grid max-w-lg grid-cols-3 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-5 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5",
        className,
      )}
    >
      {brands
        .filter((brand) => brand.shown)
        .map((brand) => (
          <TooltipProvider key={brand.name}>
            <Tooltip key={brand.name} delayDuration={300}>
              <TooltipTrigger asChild>
                <Image
                  src={brand.image}
                  alt={brand.name}
                  width={300}
                  height={300}
                  className={cn(
                    "w-full object-contain md:w-auto",
                    brand.disabled && "opacity-50 grayscale",
                    brand.className,
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{brand.disabled ? `${brand.name} not supported yet` : brand.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
    </div>
  )
}
