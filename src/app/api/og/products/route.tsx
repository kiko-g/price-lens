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

  const title = buildPageTitle({ query, sortBy, origins, category, onlyDiscounted })

  // Fetch 6 products for 3x2 grid (faster)
  const result = await queryStoreProducts({
    search: query ? { query, searchIn: "any" } : undefined,
    origin: origins?.length ? { originIds: origins.length === 1 ? origins[0] : origins } : undefined,
    categories: category ? { hierarchy: { category1: category } } : undefined,
    flags: { onlyDiscounted, excludeEmptyNames: true },
    pagination: { page: 1, limit: 6 },
    sort: { sortBy: "a-z" },
  })

  const products = result.data ?? []
  const fonts = await loadGeistFontsLight()

  return new ImageResponse(
    <div tw="flex h-full w-full flex-col" style={{ fontFamily: "Geist", backgroundColor: "#f5f5f7" }}>
      {/* Header */}
      <div tw="flex items-center justify-between px-10 pt-6 pb-4">
        <div tw="flex flex-col flex-1">
          <h1 tw="text-4xl font-semibold m-0" style={{ letterSpacing: "-0.02em", color: "#18181b" }}>
            {title}
          </h1>
          {query && <p tw="text-base text-zinc-500 m-0 mt-1">Results for &quot;{query}&quot;</p>}
        </div>

        {/* Logo Badge */}
        <div
          tw="flex items-center px-3 py-2 rounded-xl border border-zinc-200 bg-white"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        >
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
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
          <span tw="ml-2 text-lg font-semibold text-zinc-700" style={{ letterSpacing: "-0.02em" }}>
            Price Lens
          </span>
        </div>
      </div>

      {/* Products Grid - 3x2 */}
      <div tw="flex flex-1 px-8 pb-6">
        {products.length > 0 ? (
          <div tw="flex flex-wrap w-full">
            {products.slice(0, 6).map((product, i) => (
              <div key={i} tw="flex w-1/3 p-2">
                <div
                  tw="flex w-full h-full bg-white rounded-xl border border-zinc-200"
                  style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                >
                  {/* Product image */}
                  <div tw="flex w-24 h-24 items-center justify-center p-1.5 bg-white rounded-l-xl">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt="" tw="w-full h-full" style={{ objectFit: "contain" }} />
                    ) : (
                      <div tw="flex w-full h-full bg-zinc-100 rounded items-center justify-center">
                        <span tw="text-zinc-300 text-xs">No img</span>
                      </div>
                    )}
                  </div>

                  {/* Product info - fixed height with consistent alignment */}
                  <div tw="flex flex-col flex-1 py-2 pr-2 h-24">
                    {/* Top: Brand */}
                    <span
                      tw="text-xs font-semibold text-blue-600"
                      style={{ lineHeight: "14px", letterSpacing: "-0.01em" }}
                    >
                      {product.brand
                        ? product.brand.length > 16
                          ? product.brand.slice(0, 14) + "..."
                          : product.brand
                        : " "}
                    </span>

                    {/* Middle: Name (flex-1 to take remaining space) */}
                    <div tw="flex flex-1 items-start">
                      <span
                        tw="text-sm font-medium text-zinc-800"
                        style={{
                          lineHeight: "16px",
                          letterSpacing: "-0.01em",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.name || "Unknown"}
                      </span>
                    </div>

                    {/* Bottom: Price + Store - always at bottom */}
                    <div tw="flex items-center justify-between">
                      <span
                        tw="text-base font-bold"
                        style={{ color: product.discount ? "#16a34a" : "#18181b", letterSpacing: "-0.02em" }}
                      >
                        {product.price != null ? `${product.price.toFixed(2)}€` : "—"}
                      </span>

                      {product.origin_id && (
                        <span
                          tw="text-xs font-semibold px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: STORE_COLORS[product.origin_id] || "#71717a" }}
                        >
                          {STORE_NAMES[product.origin_id]?.charAt(0) || "?"}
                        </span>
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

      {/* Footer */}
      <div tw="flex items-center justify-center px-10 pb-4">
        <span tw="text-sm text-zinc-400">Compare prices across Portuguese supermarkets</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts,
    },
  )
}
