import { ImageResponse } from "next/og"
import { loadGeistFonts } from "@/lib/og-fonts"
import { OG_WIDTH, OG_HEIGHT } from "@/lib/og-layout"
import { siteConfig } from "@/lib/config"
import { getHomeStats } from "@/lib/queries/home-stats"

export const runtime = "nodejs"

function formatNumber(n: number): string {
  return n.toLocaleString("pt-PT")
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const title = url.searchParams.get("title")
  const description = url.searchParams.get("description")
  const showStats = url.searchParams.get("stats") === "true"
  const origin = url.origin ?? siteConfig.url

  const [fonts, stats] = await Promise.all([loadGeistFonts(), showStats ? getHomeStats() : null])

  const kpis = stats
    ? [
        { value: "126k+", label: "products tracked" },
        { value: `€${formatNumber(Math.round(stats.totalDiscountSavingsEuros))}`, label: "in savings" },
        { value: formatNumber(stats.productsOnDiscount), label: "on discount" },
        { value: formatNumber(stats.priceDropsToday), label: "price drops today" },
      ]
    : null

  if (kpis) {
    return new ImageResponse(
      <div tw="flex h-full w-full bg-[#08080a] text-white" style={{ fontFamily: "Geist" }}>
        {/* Ambient glows */}
        <div
          tw="absolute"
          style={{
            top: -150,
            left: 100,
            width: 900,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(99,106,215,0.11) 0%, rgba(59,138,236,0.04) 50%, transparent 70%)",
          }}
        />
        <div
          tw="absolute"
          style={{
            bottom: -100,
            right: 50,
            width: 500,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(99,106,215,0.06) 0%, transparent 60%)",
          }}
        />

        {/* Grid lines */}
        <div
          tw="absolute"
          style={{ left: 80, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.04)" }}
        />
        <div
          tw="absolute"
          style={{ right: 80, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.04)" }}
        />
        <div
          tw="absolute"
          style={{ left: 600, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.04)" }}
        />
        <div
          tw="absolute"
          style={{ top: 60, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.04)" }}
        />
        <div
          tw="absolute"
          style={{ bottom: 60, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.04)" }}
        />

        {/* Content */}
        <div tw="flex flex-col absolute items-center justify-center" style={{ inset: 0, padding: "60px 80px" }}>
          {/* Top: Logo + divider + text */}
          <div tw="flex items-center" style={{ gap: 36 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${origin}/price-lens.svg`} alt="" width={96} height={96} style={{ objectFit: "contain" }} />

            {/* Divider */}
            <div tw="flex" style={{ width: 1, height: 110, backgroundColor: "rgba(255,255,255,0.08)" }} />

            {/* Text */}
            <div tw="flex flex-col">
              <div tw="text-white" style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1 }}>
                Price Lens
              </div>
              <div
                tw="text-zinc-400 mt-2"
                style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.015em", lineHeight: 1.3 }}
              >
                Price tracking for Portuguese supermarkets
              </div>
              <div tw="text-zinc-500 mt-1" style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.01em" }}>
                Continente · Auchan · Pingo Doce
              </div>
            </div>
          </div>

          {/* KPI grid — 4 across */}
          <div tw="flex mt-12" style={{ gap: 12 }}>
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                tw="flex flex-col items-center px-8 py-5 rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <span
                  tw="text-white"
                  style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}
                >
                  {kpi.value}
                </span>
                <span tw="text-zinc-500 mt-2" style={{ fontSize: 15, fontWeight: 400 }}>
                  {kpi.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>,
      { width: OG_WIDTH, height: OG_HEIGHT, fonts },
    )
  }

  return new ImageResponse(
    <div tw="flex h-full w-full bg-[#08080a] text-white" style={{ fontFamily: "Geist" }}>
      {/* Ambient glows */}
      <div
        tw="absolute"
        style={{
          top: -150,
          left: 100,
          width: 900,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(99,106,215,0.11) 0%, rgba(59,138,236,0.04) 50%, transparent 70%)",
        }}
      />
      <div
        tw="absolute"
        style={{
          bottom: -100,
          right: 50,
          width: 500,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(99,106,215,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Grid lines */}
      <div tw="absolute" style={{ left: 80, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.04)" }} />
      <div
        tw="absolute"
        style={{ right: 80, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.04)" }}
      />
      <div tw="absolute" style={{ top: 60, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.04)" }} />
      <div
        tw="absolute"
        style={{ bottom: 60, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.04)" }}
      />

      {/* Content — centered */}
      <div tw="flex absolute items-center justify-center" style={{ inset: 0, padding: "60px 80px" }}>
        <div tw="flex items-center" style={{ gap: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${origin}/price-lens.svg`} alt="" width={96} height={96} style={{ objectFit: "contain" }} />

          <div tw="flex" style={{ width: 1, height: 110, backgroundColor: "rgba(255,255,255,0.08)" }} />

          <div tw="flex flex-col" style={{ maxWidth: 700 }}>
            <div
              tw="text-white"
              style={{
                fontSize: title && title.length > 30 ? 48 : 56,
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.15,
              }}
            >
              {title || "Price Lens"}
            </div>
            {description && (
              <div
                tw="mt-3 text-zinc-400"
                style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.01em" }}
              >
                {description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    { width: OG_WIDTH, height: OG_HEIGHT, fonts },
  )
}
