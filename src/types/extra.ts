export const searchTypes = ["name", "brand", "url", "category"] as const

export function getSearchType(searchType: string): SearchType {
  if (searchTypes.includes(searchType as SearchType)) {
    return searchType as SearchType
  }
  return "name"
}

export type SearchType = (typeof searchTypes)[number]
