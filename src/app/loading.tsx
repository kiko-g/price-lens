"use client"

// Brand splash shown while route segments stream in. Reads the brand from the server-seeded
// provider (no translations: the next-intl provider may not have hydrated yet).

import { useBrand } from "@/contexts/BrandContext"
import { LinceMark } from "@/components/icons/LinceMark"

export default function RootLoading() {
  const brand = useBrand()

  return (
    <div
      className="bg-background fixed inset-0 z-9999 flex min-h-svh w-full flex-col items-center justify-center"
      role="status"
      // eslint-disable-next-line @formatjs/no-literal-string-in-jsx -- rendered before next-intl hydrates
      aria-label="Loading"
    >
      <div className="flex animate-[fadeInScale_0.6s_ease-out_both] flex-col items-center gap-5">
        <LinceMark
          logoFashion="filled"
          pulseShapePattern="quarter-circle"
          pulseAnimation="animated"
          className="size-16 drop-shadow-[0_0_24px_rgba(234,88,12,0.4)]"
        />
        <span className="text-foreground text-lg font-bold tracking-tight">{brand.displayName}</span>
      </div>

      <div className="absolute bottom-16 flex items-center gap-1.5">
        <div className="bg-foreground/30 size-1.5 animate-[dotPulse_1.4s_ease-in-out_infinite] rounded-full" />
        <div className="bg-foreground/30 size-1.5 animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite] rounded-full" />
        <div className="bg-foreground/30 size-1.5 animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite] rounded-full" />
      </div>
    </div>
  )
}
