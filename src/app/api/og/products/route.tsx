import { ImageResponse } from "next/og"
import { loadGeistFontsLight } from "@/lib/og-fonts"
import { queryStoreProducts, SupermarketChain } from "@/lib/queries/store-products"
import { buildPageTitle } from "@/lib/business/page-title"
import { getSearchType, STORE_COLORS, STORE_LOGO_PATHS, STORE_NAMES, type SortByType } from "@/types/business"
import { OGFrame, OG_WIDTH, OG_HEIGHT } from "@/lib/og-layout"
import type { PrioritySource } from "@/types"

export const runtime = "nodejs"

const PRODUCTS_AMOUNT = 4

function parseCategoryId(slug: string): number | null {
  const match = slug.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const baseUrl = url.origin
  const { searchParams } = url
  const query = searchParams.get("q") || undefined
  const searchIn = getSearchType(searchParams.get("t") ?? "any")
  const sortBy = searchParams.get("sort") || undefined
  const priorityOrder = searchParams.get("priority_order") !== "false"
  const originParam = searchParams.get("origin")
  const categoryParam = searchParams.get("category") || undefined
  const onlyDiscounted = searchParams.get("discounted") === "true"
  const onlyAvailable = searchParams.get("available") !== "false"
  const priorityParam = searchParams.get("priority")
  const sourceParam = searchParams.get("source")

  const origins = originParam
    ?.split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && Object.values(SupermarketChain).includes(n)) as SupermarketChain[] | undefined

  const categoryId = categoryParam ? parseCategoryId(categoryParam) : null
  const priorityValues = priorityParam
    ?.split(",")
    .map((v) => parseInt(v.trim(), 10))
    .filter((v) => !isNaN(v) && v >= 0 && v <= 5)
  const sourceValues = sourceParam
    ?.split(",")
    .map((v) => v.trim())
    .filter((v): v is PrioritySource => v === "ai" || v === "manual")

  const title = buildPageTitle({
    query,
    sortBy,
    origins,
    category: categoryParam ?? undefined,
    onlyDiscounted,
  })

  const result = await queryStoreProducts({
    search: query ? { query, searchIn } : undefined,
    origin: origins?.length ? { originIds: origins.length === 1 ? origins[0] : origins } : undefined,
    canonicalCategory: categoryId && categoryId > 0 ? { categoryId } : undefined,
    priority: priorityValues?.length ? { values: priorityValues } : undefined,
    source: sourceValues?.length ? { values: sourceValues } : undefined,
    flags: {
      onlyDiscounted,
      onlyAvailable,
      excludeEmptyNames: true,
      minimalSelectForPreview: true,
    },
    pagination: { page: 1, limit: PRODUCTS_AMOUNT },
    sort: { sortBy: (sortBy as SortByType) || "a-z", prioritizeByPriority: priorityOrder },
  })

  const products = result.data ?? []
  const fonts = await loadGeistFontsLight()

  return new ImageResponse(
    <OGFrame baseUrl={baseUrl}>
      <div tw="flex flex-col w-full h-full">
        {/* Header */}
        <div tw="flex items-center px-10 pt-8 pb-4">
          <div tw="flex flex-col flex-1">
            <h1 tw="text-4xl font-semibold m-0 text-white" style={{ letterSpacing: "-0.02em" }}>
              {title}
            </h1>
            {query && <p tw="text-base text-zinc-500 m-0 mt-1">Results for &quot;{query}&quot;</p>}
          </div>
        </div>

        {/* Products Grid */}
        <div tw="flex flex-1 px-10 pb-16">
          {products.length > 0 ? (
            <div tw="flex items-start justify-start flex-wrap w-full">
              {products.slice(0, PRODUCTS_AMOUNT).map((product, i) => (
                <div key={i} tw="flex w-1/2 p-2">
                  <div
                    tw="flex w-full bg-[#18181b] rounded-xl border border-[#27272a]"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                  >
                    <div tw="flex w-48 h-48 items-center justify-center p-4 bg-white rounded-l-xl">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image}
                          alt=""
                          tw="w-full h-full rounded-lg p-1"
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <div tw="flex w-full h-full bg-zinc-100 rounded items-center justify-center">
                          <span tw="text-zinc-400 text-xs">No img</span>
                        </div>
                      )}
                    </div>

                    <div tw="flex flex-col h-full self-stretch flex-1 py-4 px-4 h-48">
                      <span
                        tw="text-sm font-semibold text-blue-400"
                        style={{ lineHeight: "16px", letterSpacing: "-0.01em" }}
                      >
                        {product.brand
                          ? product.brand.length > 22
                            ? product.brand.slice(0, 20) + "..."
                            : product.brand
                          : " "}
                      </span>

                      <div tw="flex flex-1 items-start mt-0.5">
                        <span
                          tw="text-sm font-medium text-zinc-300"
                          style={{
                            lineHeight: "18px",
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

                      <div tw="flex items-center justify-between mt-auto">
                        <span
                          tw="text-lg font-bold"
                          style={{ color: product.discount ? "#4ade80" : "#e4e4e7", letterSpacing: "-0.02em" }}
                        >
                          {product.price != null ? `${product.price.toFixed(2)}€` : "-"}
                        </span>

                        {product.origin_id && STORE_LOGO_PATHS[product.origin_id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${baseUrl}${STORE_LOGO_PATHS[product.origin_id].src}`}
                            alt={STORE_NAMES[product.origin_id] || ""}
                            width={Math.round((STORE_LOGO_PATHS[product.origin_id].width / STORE_LOGO_PATHS[product.origin_id].height) * 20)}
                            height={20}
                            tw="h-5"
                            style={{ objectFit: "contain" }}
                          />
                        ) : product.origin_id ? (
                          <span
                            tw="text-xs font-semibold px-2 py-1 rounded-xl text-white"
                            style={{ backgroundColor: STORE_COLORS[product.origin_id] || "#71717a" }}
                          >
                            {STORE_NAMES[product.origin_id]}
                          </span>
                        ) : null}
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
