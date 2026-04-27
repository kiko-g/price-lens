import type { StoreProduct } from "@/types"
import type { Locale } from "@/i18n/config"
import { formatPrice as formatPriceI18n } from "@/lib/i18n/format"

/**
 * Product labels shown in the "popular searches" area.
 * The `value` is the search term sent to the backend (always PT — that's
 * how the catalog is indexed); `labels` holds the display text per locale.
 */
export const popularProducts: Array<{ value: string; labels: Record<Locale, string> }> = [
  { value: "capsulas de cafe", labels: { pt: "Cápsulas de Café", en: "Coffee Capsules" } },
  { value: "leite", labels: { pt: "Leite", en: "Milk" } },
  { value: "atum", labels: { pt: "Atum", en: "Tuna" } },
  { value: "iogurte grego", labels: { pt: "Iogurte Grego", en: "Greek Yogurt" } },
  { value: "cereais", labels: { pt: "Cereais", en: "Cereal" } },
  { value: "fiambre", labels: { pt: "Fiambre", en: "Ham" } },
  { value: "haagen dazs", labels: { pt: "Häagen-Dazs", en: "Häagen-Dazs" } },
  { value: "salmao", labels: { pt: "Salmão", en: "Salmon" } },
  { value: "chocolate", labels: { pt: "Chocolate", en: "Chocolate" } },
  { value: "biscoitos", labels: { pt: "Biscoitos", en: "Biscuits" } },
  { value: "bolachas", labels: { pt: "Bolachas", en: "Cookies" } },
]

export function getPopularProducts(locale: Locale): Array<{ label: string; value: string }> {
  return popularProducts.map(({ value, labels }) => ({ value, label: labels[locale] ?? labels.pt }))
}

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

export function formatPrice(price: number, locale?: Locale | string) {
  return formatPriceI18n(price, locale)
}

export function formatProductName(name: string | undefined) {
  if (!name) return ""
  return name.toUpperCase() === name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name
}

export function discountValueToPercentage(discount: number, decimalPlaces = 1) {
  return `${(Math.round(discount * 1000) / 10).toFixed(decimalPlaces)}%`
}

/** Unicode minus (U+2212) + percentage; use in JSX instead of raw `−` text + {@link discountValueToPercentage}. */
export function formatDiscountPercentWithMinus(discount: number, decimalPlaces = 1) {
  return `\u2212${discountValueToPercentage(discount, decimalPlaces)}`
}
