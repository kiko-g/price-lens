import { ImageResponse } from "next/og"
import { getSupermarketProducts } from "@/app/supermarket/actions"
import { getSearchType, getSortByType } from "@/types/extra"
import { loadGeistFontsLight } from "@/lib/og-fonts"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const searchType = getSearchType(searchParams.get("t") || "any")
    const sortBy = getSortByType(searchParams.get("s") || "a-z")
    const origin = searchParams.get("origin") || null

    // Fetch products for the OG image
    const data = await getSupermarketProducts({
      page: 1,
      limit: 6, // Show top 6 products in OG image
      query,
      searchType,
      sort: sortBy,
      origin,
    })

    const fonts = await loadGeistFontsLight()

    const title = query ? `${query} Products` : "Supermarket Products"
    const subtitle = `${data.pagination.totalCount} products found${query ? ` for "${query}"` : ""}`

    // Get first few products with images
    const productsWithImages = data.products.filter((p) => p.image && p.name).slice(0, 4)

    return new ImageResponse(
      <div tw="flex h-full w-full bg-gradient-to-br from-blue-50 to-white" style={{ fontFamily: "Geist" }}>
        {/* Header */}
        <div tw="absolute top-8 left-8 right-8 flex items-center justify-between">
          <div tw="flex items-center">
            <div tw="w-8 h-8 bg-blue-600 rounded-full mr-3"></div>
            <span tw="text-gray-800 text-2xl font-semibold">Price Lens</span>
          </div>
          <div tw="text-gray-600 text-lg">Portuguese Supermarkets</div>
        </div>

        {/* Main Content */}
        <div tw="flex flex-col justify-center items-center w-full px-16 py-24">
          <div tw="text-center mb-8">
            <h1 tw="text-5xl font-bold text-gray-900 mb-2" style={{ textWrap: "balance" }}>
              {title}
            </h1>
            <p tw="text-2xl text-gray-600" style={{ textWrap: "balance" }}>
              {subtitle}
            </p>
          </div>

          {/* Product Grid */}
          {productsWithImages.length > 0 && (
            <div tw="flex flex-wrap justify-center gap-4 mt-8">
              {productsWithImages.map((product, index) => (
                <div
                  key={index}
                  tw="flex flex-col items-center bg-white rounded-lg shadow-md p-4 w-48"
                  style={{ border: "1px solid #e5e7eb" }}
                >
                  <div tw="w-24 h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                    <div tw="text-gray-400 text-xs">IMG</div>
                  </div>
                  <div tw="text-center">
                    <div
                      tw="text-sm font-medium text-gray-900 mb-1"
                      style={{
                        maxWidth: "160px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {product.name?.slice(0, 20)}
                    </div>
                    {product.price && <div tw="text-lg font-bold text-blue-600">€{product.price.toFixed(2)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <div tw="mt-8 text-center">
            <div tw="text-gray-600 text-lg">Compare prices • Track inflation • Find the best deals</div>
          </div>
        </div>

        {/* Footer */}
        <div tw="absolute bottom-8 left-8 right-8 flex justify-between items-center">
          <div tw="text-gray-500 text-base">pricelens.pt</div>
          <div tw="text-gray-500 text-base">Real-time price tracking</div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts,
      },
    )
  } catch (error) {
    // Fallback to simple OG image
    return new ImageResponse(
      <div tw="flex h-full w-full bg-blue-600 text-white items-center justify-center">
        <div tw="text-center">
          <h1 tw="text-6xl font-bold mb-4">Price Lens</h1>
          <p tw="text-2xl">Supermarket Price Tracking</p>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    )
  }
}
