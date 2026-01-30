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
  [SupermarketChain.Auchan]: "#e30713",
  [SupermarketChain.PingoDoce]: "#71a82b",
}

export const SORT_LABELS: Record<string, string> = {
  "a-z": "A to Z",
  "z-a": "Z to A",
  "price-low-high": "Cheapest",
  "price-high-low": "Expensive",
  "created-newest": "Newest",
  "created-oldest": "Oldest",
  "updated-newest": "Recently Updated",
  "updated-oldest": "Least Updated",
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
  "a-z",
  "z-a",
  "price-low-high",
  "price-high-low",
  "created-newest",
  "created-oldest",
  "updated-newest",
  "updated-oldest",
  "only-nulls",
] as const

export const sortTypesLabels: {
  [key in SortByType]: string
} = {
  "a-z": "A to Z",
  "z-a": "Z to A",
  "price-low-high": "High to Low",
  "price-high-low": "Low to High",
  "created-newest": "Newest First",
  "created-oldest": "Oldest First",
  "updated-newest": "Recently Updated",
  "updated-oldest": "Least Recently",
  "only-nulls": "Invalid products",
}

export const getSortByType = (sortBy: string) => {
  if (sortByTypes.includes(sortBy as SortByType)) return sortBy as SortByType
  return sortByTypes[0]
}

export type SortByType = (typeof sortByTypes)[number]

export const RANGES = ["1W", "2W", "1M", "3M", "6M", "1Y", "5Y", "Max"] as const
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
  "5Y": 1825,
  Max: 36500, // 100 years
}

export const PRODUCT_PRIORITY_LEVELS = [0, 1, 2, 3, 4, 5] as const
export type ProductPriorityLevel = (typeof PRODUCT_PRIORITY_LEVELS)[number]

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
