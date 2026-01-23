import { ImageResponse } from "next/og"
import { loadGeistFontsLight } from "@/lib/og-fonts"
import { queryStoreProducts, SupermarketChain } from "@/lib/db/queries/store-products"

import { buildPageTitle } from "@/lib/utils/page-title"
import { STORE_COLORS, STORE_NAMES } from "@/types/business"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || undefined
  const sortBy = searchParams.get("sort") || undefined
  const originParam = searchParams.get("origin")
  const category = searchParams.get("category") || undefined
  const onlyDiscounted = searchParams.get("discounted") === "true"

  const origins = originParam
    ?.split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && Object.values(SupermarketChain).includes(n)) as SupermarketChain[] | undefined

  // Build title from filters
  const title = buildPageTitle({ query, sortBy, origins, category, onlyDiscounted })

  // Fetch top 9 products for 3x3 grid
  const result = await queryStoreProducts({
    search: query ? { query, searchIn: "any" } : undefined,
    origin: origins?.length ? { originIds: origins.length === 1 ? origins[0] : origins } : undefined,
    categories: category ? { hierarchy: { category1: category } } : undefined,
    flags: { onlyDiscounted, excludeEmptyNames: true },
    pagination: { page: 1, limit: 9 },
    sort: { sortBy: "a-z" },
  })

  const products = result.data ?? []
  const fonts = await loadGeistFontsLight()

  return new ImageResponse(
    <div tw="flex h-full w-full flex-col text-zinc-900" style={{ fontFamily: "Geist", backgroundColor: "#f5f5f7" }}>
      {/* Header */}
      <div tw="flex items-center justify-between px-12 pt-8 pb-4">
        <div tw="flex flex-col">
          <h1 tw="text-4xl font-semibold tracking-tight" style={{ letterSpacing: "-0.02em", color: "#18181b" }}>
            {title}
          </h1>
          {query && <p tw="text-lg text-zinc-500 mt-1">Search results for &quot;{query}&quot;</p>}
        </div>
      </div>

      {/* Products Grid - 3x3 */}
      <div tw="flex flex-1 px-10 pb-4">
        {products.length > 0 ? (
          <div tw="flex flex-wrap w-full">
            {products.slice(0, 9).map((product, i) => (
              <div key={i} tw="flex w-1/3 p-2">
                <div
                  tw="flex w-full bg-white rounded-2xl overflow-hidden border border-zinc-200"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                >
                  {/* Product image */}
                  <div tw="flex w-28 h-28 bg-white items-center justify-center p-2">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt="" tw="w-full h-full rounded-lg" style={{ objectFit: "contain" }} />
                    ) : (
                      <div tw="flex w-full h-full bg-zinc-100 rounded-lg items-center justify-center">
                        <span tw="text-zinc-400 text-xs">No img</span>
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div tw="flex flex-col flex-1 py-2 pr-3 justify-center">
                    {/* Brand */}
                    {product.brand && (
                      <p tw="text-xs font-semibold text-blue-600 mb-0.5" style={{ letterSpacing: "-0.01em" }}>
                        {product.brand.length > 20 ? product.brand.slice(0, 18) + "..." : product.brand}
                      </p>
                    )}

                    {/* Name */}
                    <p
                      tw="text-sm font-medium text-zinc-800 leading-tight"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {product.name || "Unknown Product"}
                    </p>

                    {/* Price + Store */}
                    <div tw="flex items-center justify-between mt-auto pt-1">
                      <div tw="flex items-center">
                        {product.price != null && (
                          <span
                            tw="text-lg font-bold"
                            style={{
                              color: product.discount ? "#16a34a" : "#18181b",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {product.price.toFixed(2)}€
                          </span>
                        )}
                      </div>

                      {product.origin_id && (
                        <div
                          tw="flex items-center px-1.5 py-0.5 rounded text-white text-xs font-medium"
                          style={{ backgroundColor: STORE_COLORS[product.origin_id] || "#71717a" }}
                        >
                          {STORE_NAMES[product.origin_id]?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div tw="flex flex-1 items-center justify-center">
            <p tw="text-xl text-zinc-400">No products found</p>
          </div>
        )}
      </div>

      {/* Footer with logo */}
      <div tw="flex items-center justify-between px-12 pb-6">
        <span tw="text-sm text-zinc-400">Compare prices across Portuguese supermarkets</span>

        {/* Logo */}
        <div tw="flex items-center">
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
          <span tw="ml-2 text-xl font-semibold text-zinc-700" style={{ letterSpacing: "-0.02em" }}>
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
