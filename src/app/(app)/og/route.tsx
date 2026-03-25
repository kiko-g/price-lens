import { ImageResponse } from "next/og"
import { loadGeistFonts } from "@/lib/og-fonts"
import { OGFrame, OG_WIDTH, OG_HEIGHT } from "@/lib/og-layout"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const title = url.searchParams.get("title")
  const description = url.searchParams.get("description")

  const fonts = await loadGeistFonts()

  return new ImageResponse(
    <OGFrame baseUrl={url.origin}>
      {/* Subtle radial glow (echoes the Hero blobs) */}
      <div
        tw="absolute"
        style={{
          top: -100,
          right: -60,
          width: 700,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(59,138,236,0.10) 0%, rgba(99,106,215,0.06) 40%, transparent 70%)",
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
      <div tw="absolute" style={{ left: 400, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
      <div tw="absolute" style={{ right: 80, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
      <div tw="absolute" style={{ top: 80, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
      <div tw="absolute" style={{ bottom: 80, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />

      {/* Content */}
      <div tw="flex flex-col absolute justify-center px-20 py-24 pr-56" style={{ inset: 0 }}>
        <div
          style={{
            fontSize: title && title.length > 20 ? 64 : 80,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            backgroundImage: "linear-gradient(to bottom right, #ffffff 30%, #a1a1aa)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {title}
        </div>
        {description && (
          <div
            tw="mt-6 text-zinc-400"
            style={{
              fontSize: 32,
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
            }}
          >
            {description}
          </div>
        )}
      </div>
    </OGFrame>,
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
    },
  )
}
