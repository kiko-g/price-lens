export enum FrontendStatus {
  Loading = "loading",
  Loaded = "loaded",
  Error = "error",
}

export enum SupermarketChain {
  Continente = 1,
  PingoDoce = 2,
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
