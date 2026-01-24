import { Metadata } from "next"
import { notFound } from "next/navigation"

import { StoreProductPage } from "@/components/StoreProductPage"
import { storeProductQueries } from "@/lib/queries/products"
import { createClient } from "@/lib/supabase/server"
import { extractProductIdFromSlug, generateProductSlug } from "@/lib/utils"
import { siteConfig } from "@/lib/config"
import { STORE_NAMES } from "@/types/business"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getProduct(idParam: string) {
  const productId = extractProductIdFromSlug(idParam)
  if (!productId) return null

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: storeProduct } = await storeProductQueries.getById(String(productId), user?.id || null)

  return storeProduct
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idParam } = await params
  const storeProduct = await getProduct(idParam)

  if (!storeProduct) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    }
  }

  // Generate canonical URL with full slug for SEO
  const canonicalSlug = generateProductSlug(storeProduct)
  const canonicalUrl = `${siteConfig.url}/products/${storeProduct.id}-${canonicalSlug}`

  // Build OG title and description
  const storeName = storeProduct.origin_id ? STORE_NAMES[storeProduct.origin_id] : null
  const brandText = storeProduct.brand ? `${storeProduct.brand} ` : ""
  const title = `${brandText}${storeProduct.name}${storeName ? ` @ ${storeName}` : ""}`

  // Build rich description
  const discountPercentage = storeProduct.discount ? Math.round(storeProduct.discount * 1000) / 10 : null
  const descParts: string[] = []
  if (storeProduct.price) {
    const priceText = `${storeProduct.price.toFixed(2)}€${discountPercentage ? ` (-${discountPercentage}%)` : ""}`
    descParts.push(priceText)
  }
  if (storeProduct.pack) descParts.push(storeProduct.pack)
  if (storeProduct.category) descParts.push(storeProduct.category)
  const description = descParts.length > 0 ? descParts.join(" · ") : `View product details on ${siteConfig.name}`

  // Use product-specific OG image route with product image, prices, etc.
  const ogImageUrl = `${siteConfig.url}/products/${storeProduct.id}/og`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
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

export default async function ProductPage({ params }: PageProps) {
  const { id: idParam } = await params
  const storeProduct = await getProduct(idParam)

  if (!storeProduct) {
    notFound()
  }

  return (
    <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
      <StoreProductPage sp={storeProduct} />
    </div>
  )
}
