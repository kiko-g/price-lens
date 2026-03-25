import { ImageResponse } from "next/og"
import { loadGeistFonts } from "@/lib/og-fonts"
import { OGFrame, OG_WIDTH, OG_HEIGHT } from "@/lib/og-layout"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title")
  const description = searchParams.get("description")

  const fonts = await loadGeistFonts()

  return new ImageResponse(
    <OGFrame>
      <div tw="flex flex-col absolute justify-center px-16 py-20 pr-48" style={{ inset: 0 }}>
        <div
          tw="tracking-tight flex flex-col justify-center leading-[1.1]"
          style={{
            textWrap: "balance",
            fontWeight: 600,
            fontSize: title && title.length > 20 ? 64 : 80,
            letterSpacing: "-0.04em",
          }}
        >
          {title}
        </div>
        <div
          tw="text-[36px] leading-normal text-zinc-400 mt-4"
          style={{
            fontWeight: 400,
            textWrap: "balance",
          }}
        >
          {description}
        </div>
      </div>
    </OGFrame>,
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
    },
  )
}
