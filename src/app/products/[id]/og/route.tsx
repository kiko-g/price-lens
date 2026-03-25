import { ImageResponse } from "next/og"
import { loadGeistFontsLight } from "@/lib/og-fonts"
import { storeProductQueries } from "@/lib/queries/products"
import { extractProductIdFromSlug } from "@/lib/business/product"
import { STORE_NAMES, STORE_LOGO_PATHS } from "@/types/business"
import { siteConfig } from "@/lib/config"
import { OGFrame, OG_WIDTH, OG_HEIGHT } from "@/lib/og-layout"

export const runtime = "nodejs"

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str) return ""
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1).trim() + "…"
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const productId = extractProductIdFromSlug(idParam)

  if (!productId) {
    return new Response("Product not found", { status: 404 })
  }

  const { data: product } = await storeProductQueries.getById(String(productId), null)

  if (!product) {
    return new Response("Product not found", { status: 404 })
  }

  const fonts = await loadGeistFontsLight()
  const storeName = product.origin_id ? STORE_NAMES[product.origin_id] : null
  const storeLogoPath = product.origin_id ? STORE_LOGO_PATHS[product.origin_id] : null

  const currentPrice = product.price?.toFixed(2) ?? "-"
  const originalPrice = product.price_recommended?.toFixed(2)
  const pricePerUnit = product.price_per_major_unit?.toFixed(2)
  const majorUnit = product.major_unit || "kg"
  const discountPercent = product.discount ? Math.round(product.discount * 1000) / 10 : null

  return new ImageResponse(
    <OGFrame>
      <div tw="flex w-[500px] h-full items-center justify-center bg-[#111] p-8">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name || "Product"}
            tw="max-w-full max-h-full rounded-xl"
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div tw="flex w-64 h-64 bg-[#222] rounded-xl items-center justify-center text-[#666]">No Image</div>
        )}
      </div>

      <div tw="flex flex-1 flex-col justify-between p-10 pb-20">
        <div tw="flex items-center justify-between gap-4 w-full">
          {product.brand && <span tw="flex text-3xl font-semibold text-blue-500">{truncate(product.brand, 30)}</span>}
          {storeLogoPath ? (
            <div tw="flex items-center justify-end h-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${siteConfig.url}${storeLogoPath}`}
                alt={storeName || ""}
                height={40}
                tw="h-10 w-auto"
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : storeName ? (
            <div tw="flex items-center justify-end w-fit px-4 py-2 bg-emerald-900/30 rounded-full border border-emerald-700/50">
              <span tw="text-2xl text-emerald-400">{storeName}</span>
            </div>
          ) : null}
        </div>

        {product.category && (
          <div tw="flex mt-4 pt-4 border-t border-[#333]">
            <span tw="text-xl text-[#666]">
              {truncate([product.category, product.category_2, product.category_3].filter(Boolean).join(" › "), 60)}
            </span>
          </div>
        )}

        <div tw="flex flex-col mt-1 mb-8">
          <h1 tw="text-5xl font-semibold text-white leading-tight" style={{ fontWeight: 600 }}>
            {truncate(product.name, 54) || "Product"}
          </h1>
          {product.pack && <span tw="text-3xl text-[#888] mt-0">{truncate(product.pack, 70)}</span>}
        </div>

        <div tw="flex flex-col">
          <div tw="flex items-center">
            {pricePerUnit && (
              <div tw="flex items-center justify-center">
                <span tw="text-2xl text-amber-600 bg-amber-700/30 rounded-lg px-2 py-1">
                  {pricePerUnit}€/{majorUnit}
                </span>
              </div>
            )}
          </div>

          <div tw="mt-4 flex items-baseline">
            <span tw="text-6xl text-emerald-400" style={{ fontWeight: 600 }}>
              {currentPrice}€
            </span>
            {originalPrice && discountPercent && (
              <div tw="flex items-center ml-4">
                <span tw="text-3xl text-[#666] line-through">{originalPrice}€</span>
                <span tw="ml-3 px-3 py-1 bg-rose-500/20 text-rose-400 text-2xl rounded-lg">-{discountPercent}%</span>
              </div>
            )}
          </div>
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
