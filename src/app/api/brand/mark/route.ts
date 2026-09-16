import sharp from "sharp"
import { NextResponse } from "next/server"

import { getBrand } from "@/lib/brand/server"
import { renderBrandMark } from "@/lib/brand/render-mark"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const format = params.get("format") ?? "svg"
  const size = Number(params.get("size") ?? 64)
  if (!["svg", "png"].includes(format) || ![16, 24, 28, 32, 64, 180, 192, 512].includes(size)) {
    return NextResponse.json({ error: "Unsupported brand image format or size" }, { status: 400 })
  }
  try {
    const brand = await getBrand()
    const svg = await renderBrandMark(brand.mark, {
      theme: params.get("theme") === "paper" ? "paper" : "navy",
      tile: params.get("tile") === "1",
    })
    const body =
      format === "png" ? new Uint8Array(await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()) : svg
    return new Response(body, {
      headers: {
        "Content-Type": format === "png" ? "image/png" : "image/svg+xml",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("[brand/mark] render failed:", error)
    return NextResponse.json({ error: "Could not render brand image" }, { status: 500 })
  }
}
