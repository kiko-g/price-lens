export enum SupermarketChain {
  Continente = 1,
  Auchan = 2,
  PingoDoce = 3,
}

export const STORE_NAMES: Record<number, string> = {
  [SupermarketChain.Continente]: "Continente",
  [SupermarketChain.Auchan]: "Auchan",
  [SupermarketChain.PingoDoce]: "Pingo Doce",
}

export const STORE_COLORS: Record<number, string> = {
  [SupermarketChain.Continente]: "#e3001b",
  [SupermarketChain.Auchan]: "#cc2131",
  [SupermarketChain.PingoDoce]: "#71a82b",
}

export const STORE_LOGO_PATHS: Record<number, { src: string; width: number; height: number }> = {
  [SupermarketChain.Continente]: { src: "/logos/continente.png", width: 442, height: 80 },
  [SupermarketChain.Auchan]: { src: "/logos/auchan.png", width: 234, height: 80 },
  [SupermarketChain.PingoDoce]: { src: "/logos/pingo-doce.png", width: 354, height: 80 },
}

export const STORE_COLORS_SECONDARY: Record<number, string> = {
  [SupermarketChain.Continente]: "#ffffff",
  [SupermarketChain.Auchan]: "#2f9c5c",
  [SupermarketChain.PingoDoce]: "#000000",
}

export const SORT_LABELS: Record<string, string> = {
  relevance: "Most Relevant",
  "a-z": "A to Z",
  "z-a": "Z to A",
  "price-low-high": "Cheapest",
  "price-high-low": "Expensive",
  "created-newest": "Newest",
  "created-oldest": "Oldest",
  "updated-newest": "Recently Updated",
  "updated-oldest": "Least Updated",
  "price-drop": "Price Drops",
  "price-increase": "Price Increases",
  "best-discount": "Best Discounts",
}

export const searchTypes = ["any", "name", "brand", "url", "category"] as const

export function getSearchType(searchType: string): SearchType {
  if (searchTypes.includes(searchType as SearchType)) {
    return searchType as SearchType
  }
  return searchTypes[0]
}

export type SearchType = (typeof searchTypes)[number]

export const sortByTypes = [
  "relevance",
  "a-z",
  "z-a",
  "price-low-high",
  "price-high-low",
  "created-newest",
  "created-oldest",
  "updated-newest",
  "updated-oldest",
  "price-drop",
  "price-increase",
  "best-discount",
  "only-nulls",
] as const

export const sortTypesLabels: {
  [key in SortByType]: string
} = {
  relevance: "Most Relevant",
  "a-z": "A to Z",
  "z-a": "Z to A",
  "price-low-high": "High to Low",
  "price-high-low": "Low to High",
  "created-newest": "Newest First",
  "created-oldest": "Oldest First",
  "updated-newest": "Recently Updated",
  "updated-oldest": "Least Recently",
  "price-drop": "Biggest Price Drops",
  "price-increase": "Biggest Price Increases",
  "best-discount": "Best Discounts",
  "only-nulls": "Invalid products",
}

export const getSortByType = (sortBy: string) => {
  if (sortByTypes.includes(sortBy as SortByType)) return sortBy as SortByType
  return "a-z" as SortByType
}

export type SortByType = (typeof sortByTypes)[number]

export const RANGES = ["1W", "2W", "1M", "3M", "6M", "1Y", "Max"] as const
export type DateRange = (typeof RANGES)[number]

export const daysAmountInRange: {
  [key in DateRange]: number
} = {
  "1W": 7,
  "2W": 14,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  Max: 365 * 5, // 5 years (for now)
}

export const STORE_PRODUCT_FILTER_DEFAULTS_MAP = {
  sort: "updated-newest",
  origin: [],
  priority: [],
  categories: [],
  category: null,
  category2: null,
  category3: null,
  onlyDiscounted: false,
  orderByPriority: false,
  source: [],
}
