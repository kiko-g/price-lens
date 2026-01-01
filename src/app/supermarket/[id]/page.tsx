import { Metadata } from "next"
import { notFound } from "next/navigation"

import { Layout } from "@/components/layout"
import { StoreProductPage } from "@/components/StoreProductPage"
import { storeProductQueries } from "@/lib/db/queries/products"
import { createClient } from "@/lib/supabase/server"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: storeProduct } = await storeProductQueries.getById(id, user?.id || null)

    if (!storeProduct) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      }
    }

    const imageUrl = storeProduct.image ? new URL(storeProduct.image) : null
    if (imageUrl) {
      const p = imageUrl.searchParams
      const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
      fieldsToDelete.forEach((k) => p.delete(k))
      p.set("sw", "1200")
      p.set("sh", "630")
      p.set("sm", "fit")
      p.set("fit", "crop")
    }

    return {
      title: `${storeProduct.name} - ${storeProduct.brand || "Unknown Brand"}`,
      description: `${storeProduct.name}${storeProduct.pack ? ` - ${storeProduct.pack}` : ""}${storeProduct.price ? ` - ${storeProduct.price}€` : ""}`,
      openGraph: {
        title: `${storeProduct.name} - ${storeProduct.brand || "Unknown Brand"}`,
        description: `${storeProduct.name}${storeProduct.pack ? ` - ${storeProduct.pack}` : ""}${storeProduct.price ? ` - ${storeProduct.price}€` : ""}`,
        images: imageUrl ? [{ url: imageUrl.toString() }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${storeProduct.name} - ${storeProduct.brand || "Unknown Brand"}`,
        description: `${storeProduct.name}${storeProduct.pack ? ` - ${storeProduct.pack}` : ""}${storeProduct.price ? ` - ${storeProduct.price}€` : ""}`,
        images: imageUrl ? [imageUrl.toString()] : [],
      },
    }
  } catch (error) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    }
  }
}

export default async function ProductPageSupermarket({ params }: PageProps) {
  const { id } = await params

  if (!id) {
    return (
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <p>No store product id provided</p>
      </div>
    )
  }

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: storeProduct, error } = await storeProductQueries.getById(id, user?.id || null)

    if (error || !storeProduct) {
      notFound()
    }

    return (
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <StoreProductPage sp={storeProduct} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
