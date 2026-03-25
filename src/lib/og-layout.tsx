import { siteConfig } from "@/lib/config"

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

export function OGFrame({ children, baseUrl }: { children: React.ReactNode; baseUrl?: string }) {
  return (
    <div tw="flex h-full w-full bg-[#0a0a0a] text-white" style={{ fontFamily: "Geist" }}>
      {children}
      <PriceLensBadge baseUrl={baseUrl} />
    </div>
  )
}

function PriceLensBadge({ baseUrl }: { baseUrl?: string }) {
  const origin = baseUrl ?? siteConfig.url
  return (
    <div tw="absolute bottom-6 right-6 flex items-center">
      <div
        tw="flex items-center px-4 py-2.5 rounded-xl bg-white/10"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${origin}/price-lens.svg`}
          alt=""
          width={36}
          height={36}
          tw="w-9 h-9"
          style={{ objectFit: "contain" }}
        />
        <span tw="ml-2.5 text-xl font-semibold text-zinc-50" style={{ letterSpacing: "-0.02em" }}>
          Price Lens
        </span>
      </div>
    </div>
  )
}
