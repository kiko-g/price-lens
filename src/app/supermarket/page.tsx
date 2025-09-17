import type { Metadata } from "next"
import { getSearchType, getSortByType, SortByType, type SearchType } from "@/types/extra"

import { Layout } from "@/components/layout"
import { StoreProductsGrid } from "@/components/model/StoreProductsGrid"
import { getSupermarketProducts, type SupermarketProductsResult } from "./actions"
import { siteConfig } from "@/lib/config"

type SearchParams = {
  q?: string
  t?: SearchType
  s?: SortByType
  page?: string
  relevant?: string
  origin?: string
}

type Props = {
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const query = params.q || ""
  const page = params.page ? parseInt(params.page) : 1
  const searchType = getSearchType(params.t ?? "any")
  const sortBy = getSortByType(params.s ?? "a-z")
  const origin = params.origin || null

  // Get initial data for SEO
  const initialData = await getSupermarketProducts({
    page: 1, // Always use page 1 for metadata to get the most relevant results
    limit: 6, // Limit for faster metadata generation
    query,
    searchType,
    sort: sortBy,
    origin,
  })

  // Build dynamic title and description
  let title = "Supermarket Products"
  let description = "Compare prices across Portuguese supermarkets. Track inflation and find the best deals."

  if (query) {
    title = `${query} - Supermarket Products`
    description = `Find ${query} prices across Portuguese supermarkets. Compare ${initialData.pagination.totalCount} products and track price changes.`
  }

  if (page > 1) {
    title = `${title} - Page ${page}`
  }

  // Create dynamic OG image URL with product info
  const ogImageParams = new URLSearchParams()
  if (query) ogImageParams.set("q", query)
  if (params.t) ogImageParams.set("t", params.t)
  if (params.s) ogImageParams.set("s", params.s)
  if (origin) ogImageParams.set("origin", origin)

  const ogImageUrl = `${siteConfig.url}/api/og/supermarket?${ogImageParams.toString()}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function Supermarket({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams)
  const page = params.page ? parseInt(params.page) : 1
  const searchType = getSearchType(params.t ?? "any")
  const sortBy = getSortByType(params.s ?? "a-z")
  const q = params.q ?? ""
  const relevant = params.relevant === "true"
  const origin = params.origin || null

  const initialData = await getSupermarketProducts({
    page,
    limit: 36,
    query: q,
    searchType,
    sort: sortBy,
    relevant,
    origin,
  })

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: q ? `${q} - Supermarket Products` : "Supermarket Products",
    description: "Compare prices across Portuguese supermarkets",
    numberOfItems: initialData.pagination.totalCount,
    itemListElement: initialData.products.slice(0, 10).map((product, index) => ({
      "@type": "Product",
      position: index + 1,
      name: product.name,
      description: product.pack || product.name,
      image: product.image,
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${siteConfig.url}/supermarket/${product.id}`,
      },
      brand: product.brand,
      url: `${siteConfig.url}/supermarket/${product.id}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      {/* SEO: Hidden content for search engines when JS is disabled */}
      <noscript>
        <div style={{ display: "none" }}>
          <h1>{q ? `${q} - Supermarket Products` : "Supermarket Products"}</h1>
          <p>Compare prices across Portuguese supermarkets. {initialData.pagination.totalCount} products found.</p>
          {initialData.products.slice(0, 10).map((product) => (
            <div key={product.id}>
              <h2>{product.name}</h2>
              <p>Price: €{product.price}</p>
              <p>Brand: {product.brand}</p>
              <p>Description: {product.pack}</p>
            </div>
          ))}
        </div>
      </noscript>
      <Layout>
        <StoreProductsGrid
          page={page}
          q={q}
          t={searchType}
          sort={sortBy}
          relevant={relevant}
          origin={origin}
          initialData={initialData}
        />
      </Layout>
    </>
  )
}
