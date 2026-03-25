import { ImageResponse } from "next/og"
import { loadGeistFonts } from "@/lib/og-fonts"
import { OGFrame, OG_WIDTH, OG_HEIGHT } from "@/lib/og-layout"
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

  const [fonts, stats] = await Promise.all([loadGeistFonts(), showStats ? getHomeStats() : null])

  const kpis = stats
    ? [
        { value: formatNumber(stats.priceDropsToday), label: "price drops" },
        { value: formatNumber(stats.productsOnDiscount), label: "on discount" },
        { value: `€${formatNumber(Math.round(stats.totalDiscountSavingsEuros))}`, label: "savings" },
      ]
    : null

  return new ImageResponse(
    <OGFrame baseUrl={url.origin}>
      {/* Subtle radial glow */}
      <div
        tw="absolute"
        style={{
          top: -100,
          right: -60,
          width: 700,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(59,138,236,0.10) 0%, rgba(99,106,215,0.06) 40%, transparent 70%)",
        }}
      />
      <div
        tw="absolute"
        style={{
          bottom: -80,
          left: -40,
          width: 500,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(99,106,215,0.08) 0%, transparent 60%)",
        }}
      />

      {/* Faint grid lines */}
      <div tw="absolute" style={{ left: 80, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
      <div
        tw="absolute"
        style={{ left: 400, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.06)" }}
      />
      <div
        tw="absolute"
        style={{ right: 80, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.06)" }}
      />
      <div tw="absolute" style={{ top: 80, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
      <div
        tw="absolute"
        style={{ bottom: 80, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }}
      />

      {/* Content */}
      {kpis ? (
        <div tw="flex flex-col absolute" style={{ inset: 0, padding: "64px 80px 56px" }}>
          {/* Text group — vertically centered in remaining space */}
          <div tw="flex flex-col flex-1 justify-center" style={{ paddingRight: 120 }}>
            <div
              tw="text-white"
              style={{
                fontSize: 88,
                fontWeight: 600,
                letterSpacing: "-0.05em",
                lineHeight: 1,
              }}
            >
              Price Lens
            </div>

            <div
              tw="text-zinc-300 mt-5"
              style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.25 }}
            >
              Price tracking for Portuguese supermarkets
            </div>

            <div
              tw="text-zinc-500 mt-3"
              style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.4 }}
            >
              Turn price swings into savings. More money in your pocket.
            </div>
          </div>

          {/* KPI row — pinned to bottom */}
          <div tw="flex mt-4" style={{ gap: 20 }}>
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                tw="flex flex-col px-7 py-4 rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <span
                  tw="text-white"
                  style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}
                >
                  {kpi.value}
                </span>
                <span tw="text-zinc-500 mt-1.5" style={{ fontSize: 16, fontWeight: 400 }}>
                  {kpi.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div tw="flex flex-col absolute justify-center" style={{ inset: 0, padding: "72px 80px", paddingRight: 200 }}>
          <div
            tw="text-white"
            style={{
              fontSize: title && title.length > 30 ? 56 : 68,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>
          {description && (
            <div
              tw="mt-5 text-zinc-400"
              style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.01em" }}
            >
              {description}
            </div>
          )}
        </div>
      )}
    </OGFrame>,
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
    },
  )
}
