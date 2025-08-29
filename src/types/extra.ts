export enum FrontendStatus {
  Loading = "loading",
  Loaded = "loaded",
  Error = "error",
}

export enum SupermarketChain {
  Continente = 1,
  Auchan = 2,
  PingoDoce = 3,
}

export interface ScrapedSchemaAuchan {
  "@context": string
  "@type": string
  "@id": string
  name: string
  description: string
  sku: string
  gtin: string
  brand: {
    "@type": "Brand"
    name: string
  }
  image: string[]
  offers: {
    url: Record<string, unknown>
    "@type": "Offer"
    priceCurrency: string
    priceValidUntil: string
    price: string
    pricevaliduntil: string
    availability: string
  }
}

export interface ScrapedAddOnAuchan {
  event: string
  ecommerce: {
    value: number
    currency: string
    items: Array<{
      item_id: string
      item_name: string
      item_brand: string
      item_category: string
      affiliation: string
      coupon: string
      location_id: string
      item_list_id: string
      item_list_name: string
      item_variant: string
      item_category2: string
      item_category3: string
      item_category4: string
      quantity: string
      price: string
      discount: string
      index: number
    }>
  }
}

export const searchTypes = ["any", "name", "brand", "url", "category"] as const

export function getSearchType(searchType: string): SearchType {
  if (searchTypes.includes(searchType as SearchType)) {
    return searchType as SearchType
  }
  return searchTypes[0]
}

export type SearchType = (typeof searchTypes)[number]

export const sortByTypes = ["a-z", "z-a", "price-low-high", "price-high-low", "only-nulls"]
export const sortTypesLabels: {
  [key in SortByType]: string
} = {
  "a-z": "A to Z",
  "z-a": "Z to A",
  "price-low-high": "Price: Low to High",
  "price-high-low": "Price: High to Low",
  "only-nulls": "Invalid products",
}
export const getSortByType = (sortBy: string) => {
  if (sortByTypes.includes(sortBy as SortByType)) {
    return sortBy as SortByType
  }
  return sortByTypes[0]
}

export type SortByType = (typeof sortByTypes)[number]

export const RANGES = ["1W", "1M", "3M", "6M", "1Y", "5Y", "Max"] as const
export type DateRange = (typeof RANGES)[number]

export const daysAmountInRange: {
  [key in DateRange]: number
} = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "5Y": 1825,
  Max: 3650,
}

export type GetAllQuery = {
  page: number
  limit: number
  tracked?: boolean // priority 3, 4, 5 (or more if needed in the future)
  query?: string
  sort?: SortByType
  searchType?: SearchType
  nonNulls?: boolean
  categories?: string[]
  category?: string | null
  category2?: string | null
  category3?: string | null
  originId?: number | null
  userId?: string | null
  orderByPriority?: boolean
  options?: {
    onlyDiscounted: boolean
  }
}
