import type { StoreProduct } from "@/types"

export const popularProducts = [
  { label: "Cápsulas de Café", value: "capsulas de cafe" },
  { label: "Leite", value: "leite" },
  { label: "Atum", value: "atum" },
  { label: "Iogurte Grego", value: "iogurte grego" },
  { label: "Cereais", value: "cereais" },
  { label: "Fiambre", value: "fiambre" },
  { label: "Häagen-Dazs", value: "haagen dazs" },
  { label: "Salmão", value: "salmao" },
  { label: "Chocolate", value: "chocolate" },
  { label: "Biscoitos", value: "biscoitos" },
  { label: "Bolachas", value: "bolachas" },
]

/**
 * Generates a URL-safe slug from a store product
 * Format: {brand}-{name_shorthand}-{origin_id}
 */
export function generateProductSlug(product: {
  brand?: string | null
  name?: string | null
  origin_id?: number | null
}): string {
  const slugify = (text: string | null | undefined): string => {
    if (!text) return ""
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // spaces to dashes
      .replace(/-+/g, "-") // multiple dashes to single
      .replace(/^-|-$/g, "") // trim leading/trailing dashes
  }

  const brand = slugify(product.brand)
  // Take first 4-5 meaningful words from name
  const nameParts = slugify(product.name)?.split("-").slice(0, 5).join("-") || ""
  const originId = product.origin_id ?? ""

  const parts = [brand, nameParts, originId].filter(Boolean)
  return parts.join("-") || "product"
}

/**
 * Generates a full product URL path with ID and slug
 * Format: /products/{id}-{slug}
 */
export function generateProductPath(product: StoreProduct): string {
  const slug = generateProductSlug(product)
  return `/products/${product.id}-${slug}`
}

/**
 * Extracts the numeric ID from a product URL segment
 * Handles both "/products/123" and "/products/123-coca-cola-1"
 */
export function extractProductIdFromSlug(slug: string): number | null {
  // Match digits at the start of the string
  const match = slug.match(/^(\d+)/)
  if (!match) return null
  const id = parseInt(match[1], 10)
  return isNaN(id) ? null : id
}

export function generateNativeShareUrl(product: StoreProduct): string {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}${generateProductPath(product)}`
}

export function resizeImgSrc(src: string, width: number, height: number) {
  if (!src) return ""

  const updatedSrc = src.replace(/sw=\d+/g, `sw=${width}`).replace(/sh=\d+/g, `sh=${height}`)
  return updatedSrc
}

export function packageToUnit(pack: string) {
  return pack.replace("emb.", "").replace(/\s+/g, " ").trim()
}

export function priceToNumber(price: string) {
  if (typeof price === "number") return price
  return Number(price.replace(",", ".").replace(/[^0-9.-]+/g, "")) // assuming PT locale
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(price)
}

export function formatProductName(name: string | undefined) {
  if (!name) return ""
  return name.toUpperCase() === name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name
}

export function discountValueToPercentage(discount: number) {
  return `${(Math.round(discount * 1000) / 10).toFixed(1)}%`
}
