import { siteConfig } from "@/lib/config"
import { BRAND_MARK_SRC } from "@/lib/brand/brand"

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

type OGFrameProps = {
  children: React.ReactNode
  baseUrl?: string
  /** Brand display name from `getBrand()` — route handlers resolve it and pass it down. */
  brandName: string
}

export function OGFrame({ children, baseUrl, brandName }: OGFrameProps) {
  return (
    <div tw="flex h-full w-full bg-[#0a0a0a] text-white" style={{ fontFamily: "Geist" }}>
      {children}
      <BrandBadge baseUrl={baseUrl} brandName={brandName} />
    </div>
  )
}

function BrandBadge({ baseUrl, brandName }: { baseUrl?: string; brandName: string }) {
  const origin = baseUrl ?? siteConfig.url
  return (
    <div tw="absolute bottom-6 right-6 flex items-center">
      <div
        tw="flex items-center px-4 py-2.5 rounded-xl bg-white/10"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${origin}${BRAND_MARK_SRC}`}
          alt=""
          width={36}
          height={36}
          tw="w-9 h-9"
          style={{ objectFit: "contain" }}
        />
        <span tw="ml-2.5 text-xl font-semibold text-zinc-50" style={{ letterSpacing: "-0.02em" }}>
          {brandName}
        </span>
      </div>
    </div>
  )
}
