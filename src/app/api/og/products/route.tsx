import { ImageResponse } from "next/og"
import { loadGeistFontsLight } from "@/lib/og-fonts"
import { queryStoreProducts, SupermarketChain } from "@/lib/db/queries/store-products"
import { buildPageTitle } from "@/lib/utils/page-title"

const STORE_NAMES: Record<number, string> = { 1: "Continente", 2: "Auchan", 3: "Pingo Doce" }

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

  // Fetch top 6 products matching filters
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
    <div tw="flex h-full w-full bg-zinc-950 text-white" style={{ fontFamily: "Geist" }}>
      {/* Background grid pattern */}
      <div tw="flex absolute inset-0 opacity-30">
        <div tw="flex absolute border-l border-zinc-700 border-dashed h-full left-[64px]" />
        <div tw="flex absolute border-l border-zinc-700 border-dashed h-full right-[64px]" />
        <div tw="flex absolute border-t border-zinc-700 w-full top-[64px]" />
        <div tw="flex absolute border-t border-zinc-700 w-full bottom-[64px]" />
      </div>

      {/* Logo */}
      <div tw="flex absolute top-10 left-12 items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width={36} height={36}>
          <rect width="256" height="256" fill="none" />
          <line
            x1="208"
            y1="128"
            x2="128"
            y2="208"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="32"
          />
          <line
            x1="192"
            y1="40"
            x2="40"
            y2="192"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="32"
          />
        </svg>
        <span tw="ml-3 text-2xl font-semibold">Price Lens</span>
      </div>

      {/* Main content */}
      <div tw="flex flex-col absolute inset-0 pt-24 pb-20 px-12">
        {/* Title */}
        <div tw="flex flex-col mb-6">
          <h1
            tw="text-5xl font-semibold tracking-tight leading-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            {title}
          </h1>
          {query && (
            <p tw="text-xl text-zinc-400 mt-2">
              Search results for &quot;{query}&quot;
            </p>
          )}
        </div>

        {/* Products Grid - 2x3 */}
        {products.length > 0 ? (
          <div tw="flex flex-wrap flex-1 -mx-2">
            {products.slice(0, 6).map((product, i) => (
              <div key={i} tw="flex w-1/3 px-2 mb-3">
                <div tw="flex w-full bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                  {/* Product image */}
                  <div tw="flex w-20 h-20 bg-white rounded-lg overflow-hidden items-center justify-center mr-3">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        tw="w-full h-full"
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      <div tw="flex w-full h-full bg-zinc-200 items-center justify-center">
                        <span tw="text-zinc-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div tw="flex flex-col flex-1 justify-center overflow-hidden">
                    <p
                      tw="text-sm font-medium text-white leading-tight"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {product.name || "Unknown Product"}
                    </p>
                    <div tw="flex items-center mt-1">
                      {product.price != null && (
                        <span tw="text-lg font-semibold text-emerald-400">
                          {product.price.toFixed(2)}€
                        </span>
                      )}
                      {product.origin_id && (
                        <span tw="text-xs text-zinc-500 ml-2">
                          {STORE_NAMES[product.origin_id] || "Store"}
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
            <p tw="text-xl text-zinc-500">No products found</p>
          </div>
        )}

        {/* Footer info */}
        <div tw="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800">
          <span tw="text-zinc-500 text-sm">Compare prices across supermarkets</span>
          <span tw="text-zinc-500 text-sm">pricelens.pt</span>
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
