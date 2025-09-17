import { ImageResponse } from "next/og"
import { loadGeistFonts } from "@/lib/og-fonts"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title")
  const description = searchParams.get("description")

  const fonts = await loadGeistFonts()

  return new ImageResponse(
    (
      <div tw="flex h-full w-full bg-black text-white" style={{ fontFamily: "Geist Sans" }}>
        <div tw="flex border absolute border-stone-700 border-dashed inset-y-0 left-16 w-px" />
        <div tw="flex border absolute border-stone-700 border-dashed inset-y-0 right-16 w-px" />
        <div tw="flex border absolute border-stone-700 inset-x-0 h-px top-16" />
        <div tw="flex border absolute border-stone-700 inset-x-0 h-px bottom-16" />
        <div tw="flex absolute flex-row bottom-24 right-24 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width={48} height={48}>
            <rect width="256" height="256" fill="none"></rect>
            <line
              x1="208"
              y1="128"
              x2="128"
              y2="208"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="32"
            ></line>
            <line
              x1="192"
              y1="40"
              x2="40"
              y2="192"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="32"
            ></line>
          </svg>
        </div>
        <div tw="flex flex-col absolute w-[896px] justify-center inset-32">
          <div
            tw="tracking-tight flex-grow-1 flex flex-col justify-center leading-[1.1]"
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
            tw="text-[40px] leading-normal flex-grow-1 text-stone-400"
            style={{
              fontWeight: 500,
              textWrap: "balance",
            }}
          >
            {description}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 628,
      fonts,
    },
  )
}
