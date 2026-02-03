import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"

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
        "sm:max-w-m mx-auto mt-10 grid max-w-lg grid-cols-3 items-center justify-items-center gap-6 sm:gap-10 md:mx-0 lg:max-w-lg xl:max-w-xl",
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
                    brand.disabled && "cursor-not-allowed grayscale",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                {brand.disabled ? `${brand.name} will be supported soon` : `${brand.name} is supported`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ))}
    </div>
  )
}
