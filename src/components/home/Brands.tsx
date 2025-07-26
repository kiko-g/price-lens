"use client"

import { cn } from "@/lib/utils"

import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Brands({ className }: { className?: string }) {
  const brands = [
    {
      name: "Continente",
      component: ContinenteSvg,
      disabled: false,
    },
    {
      name: "Auchan",
      component: AuchanSvg,
      disabled: false,
    },
    {
      name: "Pingo Doce",
      component: PingoDoceSvg,
      disabled: false,
    },
  ]

  return (
    <div
      className={cn(
        "mx-auto mt-10 grid max-w-lg grid-cols-2 items-center justify-items-center gap-x-8 gap-y-10 sm:max-w-md sm:grid-cols-3 sm:gap-x-10 md:mx-0 md:grid-cols-3 lg:max-w-lg lg:grid-cols-3 xl:max-w-xl xl:grid-cols-3",
        className,
      )}
    >
      {brands.map((brand) => (
        <div key={brand.name} className="flex w-full justify-center">
          <TooltipProvider>
            <Tooltip key={brand.name} delayDuration={300}>
              <TooltipTrigger asChild>
                <brand.component
                  className={cn(
                    "h-auto w-24 sm:w-36 md:w-32 lg:w-32 xl:w-36",
                    brand.disabled && "opacity-50 grayscale",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{brand.disabled ? `${brand.name} will be supported soon` : `${brand.name} is supported`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ))}
    </div>
  )
}
