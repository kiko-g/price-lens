import { ImageResponse } from "next/og"
import { loadGeistFontsLight } from "@/lib/og-fonts"
import { storeProductQueries } from "@/lib/queries/products"
import { extractProductIdFromSlug } from "@/lib/utils"
import { STORE_NAMES } from "@/types/business"

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

  // Format prices
  const currentPrice = product.price?.toFixed(2) ?? "—"
  const originalPrice = product.price_recommended?.toFixed(2)
  const pricePerUnit = product.price_per_major_unit?.toFixed(2)
  const majorUnit = product.major_unit || "kg"
  const discountPercent = product.discount ? Math.round(product.discount * 1000) / 10 : null

  return new ImageResponse(
    <div tw="flex h-full w-full bg-[#0a0a0a]" style={{ fontFamily: "Geist" }}>
      {/* Product Image Section */}
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

      {/* Product Info Section */}
      <div tw="flex flex-1 flex-col justify-between p-10">
        {/* Top: Brand & Store */}
        <div tw="flex items-center justify-between gap-4 w-full">
          {product.brand && <span tw="flex text-3xl font-semibold text-blue-600">{truncate(product.brand, 30)}</span>}
          {storeName && (
            <div tw="flex items-center justify-end w-fit px-4 py-2 bg-emerald-900/30 rounded-full border border-emerald-700/50">
              <span tw="text-2xl text-emerald-400">{storeName}</span>
            </div>
          )}
        </div>

        {/* Category breadcrumb */}
        {product.category && (
          <div tw="flex mt-4 pt-4 border-t border-[#333]">
            <span tw="text-xl text-[#666]">
              {truncate([product.category, product.category_2, product.category_3].filter(Boolean).join(" › "), 60)}
            </span>
          </div>
        )}

        {/* Middle: Name & Pack */}
        <div tw="flex flex-col mt-1 mb-8">
          <h1 tw="text-5xl font-semibold text-white leading-tight" style={{ fontWeight: 600 }}>
            {truncate(product.name, 54) || "Product"}
          </h1>
          {product.pack && <span tw="text-3xl text-[#888] mt-0">{truncate(product.pack, 70)}</span>}
        </div>

        {/* Bottom: Prices */}
        <div tw="flex flex-col">
          <div tw="flex items-center">
            {/* Price per unit */}
            {pricePerUnit && (
              <div tw="flex items-center justify-center">
                <span tw="text-2xl text-amber-600 bg-amber-700/30 rounded-lg px-2 py-1">
                  {pricePerUnit}€/{majorUnit}
                </span>
              </div>
            )}
          </div>

          {/* Main Price Row */}
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

      <div tw="absolute bottom-6 right-6 flex items-center">
        {/* Logo Badge */}
        <div
          tw="flex items-center px-4 py-2.5 rounded-xl bg-white/10"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        >
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="grad" x1="26.5" y1="4" x2="7.5" y2="29.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#688EEF" />
                <stop offset="1" stopColor="#A57EEC" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="16" fill="url(#grad)" />
            <rect x="16" y="16" width="8" height="8" rx="2" fill="white" fillOpacity="0.4" />
            <rect x="12" y="12" width="8" height="8" rx="2" fill="white" fillOpacity="0.5" />
            <rect x="8" y="8" width="8" height="8" rx="2" fill="white" />
          </svg>
          <span tw="ml-2.5 text-xl font-semibold text-zinc-50" style={{ letterSpacing: "-0.02em" }}>
            Price Lens
          </span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts,
    },
  )
}
